const { q } = require('../db');

// Lifetime counters per player (shifts worked, fish caught, ...). Drive achievements and /profile.

function get(userId, key) {
    return q('SELECT value FROM stats WHERE user_id = ? AND key = ?').get(userId, key)?.value ?? 0;
}

function add(userId, key, amount = 1) {
    q('INSERT INTO stats (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT (user_id, key) DO UPDATE SET value = value + excluded.value')
        .run(userId, key, Math.floor(amount));
}

/** Keeps the highest value seen (streaks, counts that can go down). */
function max(userId, key, value) {
    q('INSERT INTO stats (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT (user_id, key) DO UPDATE SET value = MAX(value, excluded.value)')
        .run(userId, key, Math.floor(value));
}

function all(userId) {
    return Object.fromEntries(q('SELECT key, value FROM stats WHERE user_id = ?').all(userId).map((r) => [r.key, r.value]));
}

module.exports = { get, add, max, all };
