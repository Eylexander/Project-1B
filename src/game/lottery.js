const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const economy = require('./economy');
const rng = require('./rng');

const TICKET_PRICE = 1_000;
const MAX_TICKETS = 100;
const SEED = 25_000;
const POT_SHARE = 0.9; // the rest goes to the treasury
const DRAW_HOUR_UTC = 19; // 20:00/21:00 in France

function nextDrawTime(now = Date.now()) {
    const date = new Date(now);
    let at = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), DRAW_HOUR_UTC);
    if (at <= now) at += 24 * 60 * 60 * 1000;
    return at;
}

/** The open draw, created if there is none. */
function current(now = Date.now()) {
    let draw = q('SELECT * FROM lottery_draws WHERE drawn_at IS NULL ORDER BY id DESC LIMIT 1').get();
    if (!draw) {
        // Fund the base pot from the treasury when possible, otherwise the house pays the seed.
        const seed = SEED + economy.fromTreasury(SEED);
        const id = q('INSERT INTO lottery_draws (seed, draws_at) VALUES (?, ?)').run(seed, nextDrawTime(now)).lastInsertRowid;
        draw = q('SELECT * FROM lottery_draws WHERE id = ?').get(id);
    }
    const tickets = q('SELECT COALESCE(SUM(tickets), 0) AS t, COUNT(*) AS players FROM lottery_tickets WHERE draw_id = ?').get(draw.id);
    return { ...draw, tickets: tickets.t, players: tickets.players, pot: draw.seed + Math.floor(tickets.t * TICKET_PRICE * POT_SHARE) };
}

function ticketsOf(userId, drawId) {
    return q('SELECT tickets FROM lottery_tickets WHERE draw_id = ? AND user_id = ?').get(drawId, userId)?.tickets ?? 0;
}

function buy(userId, count, now = Date.now()) {
    const draw = current(now);
    const owned = ticketsOf(userId, draw.id);
    if (owned + count > MAX_TICKETS) throw new GameError(`You can hold at most **${MAX_TICKETS}** tickets per draw (you have ${owned}).`, { emoji: '🎟️' });
    const cost = count * TICKET_PRICE;
    tx(() => {
        economy.debit(userId, cost, 'lottery_ticket', `${count} ticket(s) for draw #${draw.id}`);
        q(`
            INSERT INTO lottery_tickets (draw_id, user_id, tickets) VALUES (?, ?, ?)
            ON CONFLICT (draw_id, user_id) DO UPDATE SET tickets = tickets + excluded.tickets
        `).run(draw.id, userId, count);
    });
    economy.toTreasury(Math.floor(cost * (1 - POT_SHARE)));
    return { draw: current(now), owned: owned + count, cost };
}

/** Runs the draw if it is due. Returns the result, or null when nothing happened. */
function drawIfDue(now = Date.now(), force = false) {
    const draw = current(now);
    if (!force && draw.draws_at > now) return null;
    const entries = q('SELECT user_id, tickets FROM lottery_tickets WHERE draw_id = ?').all(draw.id);
    const result = tx(() => {
        if (!entries.length) {
            // No players: roll the seed over to the next draw.
            q('UPDATE lottery_draws SET drawn_at = ?, pot = 0, tickets = 0 WHERE id = ?').run(now, draw.id);
            economy.toTreasury(draw.seed);
            return { draw, winner: null };
        }
        const [winnerId] = rng.weighted(entries.map((e) => [e.user_id, e.tickets]));
        q('UPDATE lottery_draws SET drawn_at = ?, winner_id = ?, pot = ?, tickets = ? WHERE id = ?').run(now, winnerId, draw.pot, draw.tickets, draw.id);
        economy.credit(winnerId, draw.pot, 'lottery', `Won draw #${draw.id}`);
        const winnerTickets = entries.find((e) => e.user_id === winnerId).tickets;
        return { draw, winner: winnerId, winnerTickets };
    });
    current(now); // open the next draw right away
    return result;
}

function lastResult() {
    return q('SELECT d.*, u.username AS winner_name FROM lottery_draws d LEFT JOIN users u ON u.id = d.winner_id WHERE d.drawn_at IS NOT NULL ORDER BY d.id DESC LIMIT 1').get() ?? null;
}

module.exports = { current, ticketsOf, buy, drawIfDue, lastResult, nextDrawTime, TICKET_PRICE, MAX_TICKETS };
