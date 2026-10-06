const { q, tx } = require('../db');
const networth = require('./networth');
const { BILLION, DAY } = require('./formulas');

// Daily net worth snapshots: the history behind /journey and the weekly Forbes list.

function dayKey(ms) {
    return new Date(ms).toISOString().slice(0, 10);
}

/** Records everyone's net worth for the day (replacing an earlier snapshot of the same day). */
function snapshot(now = Date.now()) {
    const day = dayKey(now);
    const rows = networth.ranking('networth', { limit: 1_000_000 });
    const insert = q('INSERT OR REPLACE INTO networth_history (user_id, day, networth) VALUES (?, ?, ?)');
    tx(() => {
        for (const row of rows) insert.run(row.id, day, row.networth);
    });
    return rows.length;
}

/** Up to `days` daily values, oldest first. */
function history(userId, days = 60) {
    return q('SELECT day, networth FROM networth_history WHERE user_id = ? ORDER BY day DESC LIMIT ?').all(userId, days).reverse();
}

/**
 * How fast a player is getting richer, from the oldest snapshot in the last week to now.
 * Returns { perDay, etaDays } (etaDays is null when not growing).
 */
function pace(userId, current, now = Date.now()) {
    const since = dayKey(now - 7 * DAY);
    const base = q('SELECT day, networth FROM networth_history WHERE user_id = ? AND day >= ? ORDER BY day ASC LIMIT 1').get(userId, since);
    if (!base) return { perDay: 0, etaDays: null, days: 0 };
    const days = Math.max(1, (now - Date.parse(`${base.day}T00:00:00Z`)) / DAY);
    const perDay = (current - base.networth) / days;
    const etaDays = perDay > 0 && current < BILLION ? Math.ceil((BILLION - current) / perDay) : null;
    return { perDay, etaDays, days };
}

/** Biggest net worth gains between `days` ago and the latest snapshot. */
function climbers({ days = 7, limit = 3, now = Date.now() } = {}) {
    return q(`
        SELECT h.user_id, u.username, h.networth - old.networth AS gain
        FROM networth_history h
        JOIN networth_history old ON old.user_id = h.user_id AND old.day = ?
        JOIN users u ON u.id = h.user_id
        WHERE h.day = ? AND h.networth > old.networth
        ORDER BY gain DESC LIMIT ?
    `).all(dayKey(now - days * DAY), dayKey(now), limit);
}

module.exports = { snapshot, history, pace, climbers, dayKey };
