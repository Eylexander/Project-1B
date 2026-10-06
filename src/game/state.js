const { q } = require('../db');

// Small global key/value store (treasury, scheduler timestamps, active events...).
function get(key, fallback = null) {
    const row = q('SELECT value FROM state WHERE key = ?').get(key);
    if (!row) return fallback;
    try {
        return JSON.parse(row.value);
    } catch {
        return fallback;
    }
}

function set(key, value) {
    q('INSERT INTO state (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
    return value;
}

function increment(key, amount) {
    return set(key, (get(key, 0) || 0) + amount);
}

module.exports = { get, set, increment };
