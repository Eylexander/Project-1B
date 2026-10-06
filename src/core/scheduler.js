const { ActivityType } = require('discord.js');
const logger = require('./logger');
const { announce } = require('./announce');
const state = require('../game/state');
const stocks = require('../game/stocks');
const lottery = require('../game/lottery');
const market = require('../game/market');
const events = require('../game/events');
const journey = require('../game/journey');
const networth = require('../game/networth');
const rng = require('../game/rng');
const { q } = require('../db');
const { HOUR } = require('../game/formulas');
const { Card } = require('../ui/card');
const theme = require('../ui/theme');
const { money, compact, pct, relative } = require('../game/format');

const INTERVAL_MS = 30_000;
const MAX_CATCHUP_TICKS = 12;
const GOLDEN_HOUR_CHANCE = 0.08; // rolled once per hour

/** Moves stock prices, catching up a little if the bot was offline. Returns any news. */
function runStocks(now) {
    const last = state.get('stocks_last_tick', 0);
    if (now - last < stocks.TICK_MS) return [];
    const missed = last ? Math.min(Math.floor((now - last) / stocks.TICK_MS), MAX_CATCHUP_TICKS) : 1;
    const news = [];
    for (let i = missed - 1; i >= 0; i--) news.push(...stocks.tick(now - i * stocks.TICK_MS));
    state.set('stocks_last_tick', now);

    const day = new Date(now).toISOString().slice(0, 10);
    if (state.get('stocks_day') !== day) {
        stocks.newTradingDay();
        state.set('stocks_day', day);
    }
    return news;
}

async function tick(client, now = Date.now()) {
    const news = runStocks(now);
    for (const item of news.filter((n) => Math.abs(n.change) >= 0.1)) {
        const stock = stocks.STOCKS[item.symbol];
        await announce(client, new Card({ title: 'Breaking market news', emoji: '📰', color: item.change > 0 ? theme.success : theme.danger })
            .text(`**${stock.emoji} ${item.symbol}** · ${item.headline}\nShares moved **${pct(item.change)}**.`)
            .footer('Trade with /stocks'));
    }

    await runDaily(client, now);

    const draw = lottery.drawIfDue(now);
    if (draw?.winner) {
        const winner = q('SELECT username FROM users WHERE id = ?').get(draw.winner)?.username ?? 'Someone';
        logger.info(`Lottery #${draw.draw.id} won by ${winner} (${draw.draw.pot})`);
        await announce(client, new Card({ title: `Lottery draw #${draw.draw.id}`, emoji: '🎟️', color: theme.brand })
            .text(`<@${draw.winner}> (**${winner}**) won the jackpot of **${money(draw.draw.pot)}** with ${draw.winnerTickets} ticket(s)!`)
            .footer('Next draw is open. Buy tickets with /lottery buy'));
    }

    if (now - state.get('hourly_at', 0) >= HOUR) {
        state.set('hourly_at', now);
        const expired = market.expire(now);
        if (expired) logger.info(`Returned ${expired} expired market listing(s).`);
        if (!events.goldenHourUntil(now) && rng.chance(GOLDEN_HOUR_CHANCE)) {
            const until = events.startGoldenHour(30, now);
            logger.info('Golden Hour started.');
            await announce(client, new Card({ title: 'Golden Hour!', emoji: '✨', color: theme.brand })
                .text(`All work pays **double** until ${relative(until)}. Go get that bag.`)
                .footer('Use /work'));
        }
    }

    updatePresence(client);
}

/** The weekly Forbes list: richest players and biggest climbers. */
function forbesCard(now) {
    const top = networth.ranking('networth', { limit: 5 });
    const climbers = journey.climbers({ days: 7, limit: 3, now });
    if (!top.length) return null;
    const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
    return new Card({ title: 'The weekly Forbes list', emoji: '📰', subtitle: 'Who is closest to the first billion?', color: theme.brand })
        .text('**Richest players**')
        .lines(top.map((row, i) => `${medals[i]} **${row.username}** · ${compact(row.networth)} (${pct(row.networth / 1e9, { sign: false, digits: 2 })})`))
        .text(climbers.length ? '\n**Biggest climbers this week**' : null)
        .lines(climbers.map((c) => `📈 **${c.username}** +${compact(c.gain)}`))
        .footer('See your own progress with /journey');
}

/** Once per UTC day: snapshot everyone's net worth. On Mondays, post the Forbes list. */
async function runDaily(client, now) {
    const day = journey.dayKey(now);
    if (state.get('snapshot_day') === day) return;
    const count = journey.snapshot(now);
    state.set('snapshot_day', day);
    logger.info(`Recorded net worth for ${count} player(s).`);

    const monday = new Date(now).getUTCDay() === 1;
    if (monday && state.get('forbes_day') !== day) {
        state.set('forbes_day', day);
        const card = forbesCard(now);
        if (card) await announce(client, card);
    }
}

let presenceIndex = 0;
function updatePresence(client) {
    if (!client.user) return;
    const players = q('SELECT COUNT(*) AS c, COALESCE(SUM(wallet + bank), 0) AS cash FROM users').get();
    const lines = [
        '💰 Racing to $1,000,000,000 · /help',
        `👥 ${players.c} players · ${compact(players.cash)} in circulation`,
        events.goldenHourUntil() ? '✨ Golden Hour: double work pay!' : '📈 Discord Street is open · /stocks',
    ];
    presenceIndex = (presenceIndex + 1) % lines.length;
    client.user.setPresence({ activities: [{ name: 'status', type: ActivityType.Custom, state: lines[presenceIndex] }], status: 'online' });
}

function start(client) {
    const run = () => tick(client).catch((error) => logger.error('Scheduler tick failed:', error));
    run();
    return setInterval(run, INTERVAL_MS);
}

module.exports = { start, tick, runStocks, runDaily, forbesCard };
