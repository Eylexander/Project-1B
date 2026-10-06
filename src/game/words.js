const { q } = require('../db');

// Trigger words (from v1): safety words show a help message, badwords get a silly reply.
const TYPES = ['suicide', 'badword', 'reply', 'rickroll'];
const REFRESH_MS = 5 * 60 * 1000;

let cache = null;
let loadedAt = 0;

function load() {
    cache = Object.fromEntries(TYPES.map((type) => [type, []]));
    for (const row of q('SELECT type, word FROM words').all()) {
        if (cache[row.type]) cache[row.type].push(row.word);
    }
    loadedAt = Date.now();
    return cache;
}

function get(type) {
    if (!cache || Date.now() - loadedAt > REFRESH_MS) load();
    return cache[type] ?? [];
}

function add(type, word) {
    const result = q('INSERT OR IGNORE INTO words (type, word) VALUES (?, ?)').run(type, type === 'reply' || type === 'rickroll' ? word : word.toLowerCase());
    load();
    return result.changes > 0;
}

function remove(type, word) {
    const result = q('DELETE FROM words WHERE type = ? AND (word = ? OR word = ?)').run(type, word, word.toLowerCase());
    load();
    return result.changes > 0;
}

function matches(type, text) {
    const lower = text.toLowerCase();
    return get(type).some((word) => lower.includes(word));
}

module.exports = { get, add, remove, matches, load, TYPES };
