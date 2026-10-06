const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q } = require('../../db');
const player = require('../../core/player');
const state = require('../../game/state');
const stocks = require('../../game/stocks');
const lottery = require('../../game/lottery');
const events = require('../../game/events');
const networth = require('../../game/networth');
const { INCOME } = require('../../game/economy');
const { money, compact, pct, relative, num } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

const SINKS = ['buy', 'business_buy', 'business_upgrade', 'market_fee', 'fine', 'heist_entry', 'lottery_ticket'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('The state of the Project 1B economy: money supply, flows, markets.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        player.self(interaction);
        const day = Date.now() - 24 * 60 * 60 * 1000;
        const totals = q('SELECT COUNT(*) AS players, COALESCE(SUM(wallet), 0) AS wallets, COALESCE(SUM(bank), 0) AS banks FROM users').get();
        const active = q('SELECT COUNT(DISTINCT user_id) AS c FROM transactions WHERE created_at > ?').get(day).c;
        const stockValue = Math.floor(q('SELECT COALESCE(SUM(h.shares * s.price), 0) AS v FROM holdings h JOIN stocks s ON s.symbol = h.symbol').get().v / 100);
        const invested = q('SELECT COALESCE(SUM(invested), 0) AS v FROM businesses').get().v;
        const flows = q('SELECT type, SUM(amount) AS total FROM transactions WHERE created_at > ? GROUP BY type').all(day);
        const created = flows.filter((f) => INCOME.has(f.type) && f.total > 0).reduce((sum, f) => sum + f.total, 0);
        const destroyed = -flows.filter((f) => SINKS.includes(f.type)).reduce((sum, f) => sum + f.total, 0);
        const gambled = flows.find((f) => f.type === 'bet')?.total ?? 0;
        const paidOut = flows.find((f) => f.type === 'gamble')?.total ?? 0;
        const all = stocks.all();
        const index = all.length ? all.reduce((sum, s) => sum + s.change, 0) / all.length : 0;
        const movers = [...all].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3);
        const top = networth.ranking('networth', { limit: 1 })[0];
        const draw = lottery.current();
        const golden = events.goldenHourUntil();

        await interaction.reply(payload(new Card({ title: 'State of the economy', emoji: '🌍', subtitle: `${num(totals.players)} players · ${num(active)} active in the last 24h`, color: theme.finance })
            .lines([
                `💵 **Cash in circulation** ${money(totals.wallets + totals.banks)} (${compact(totals.wallets)} in wallets, ${compact(totals.banks)} in banks)`,
                `📈 **Held in stocks** ${money(stockValue)} · 🏢 **Invested in businesses** ${money(invested)}`,
                top ? `👑 **Richest player** ${top.username} with ${compact(top.networth)} (${pct(top.networth / 1e9, { sign: false, digits: 2 })} of the way to 1B)` : null,
            ])
            .divider()
            .lines([
                '**Last 24 hours**',
                `🟢 Money created: **${money(created)}**`,
                `🔴 Money destroyed (shop, fees, fines...): **${money(destroyed)}**`,
                `🎰 Casino: ${money(-gambled)} wagered, ${money(paidOut)} paid out (house ${money(-gambled - paidOut)})`,
                `🏛️ Treasury (taxes & fees): **${money(state.get('treasury', 0))}**`,
            ])
            .divider()
            .lines([
                `🏛️ **Discord Street index** ${index >= 0 ? '🟢' : '🔴'} ${pct(index)} today · biggest movers: ${movers.map((s) => `${s.symbol} ${pct(s.change)}`).join(', ')}`,
                `🎟️ **Lottery jackpot** ${money(draw.pot)} · draw ${relative(draw.draws_at)}`,
                golden ? `✨ **Golden Hour** is on! Double work pay until ${relative(golden)}` : '✨ No Golden Hour right now. It starts at random, keep an eye out.',
            ])));
    },
};
