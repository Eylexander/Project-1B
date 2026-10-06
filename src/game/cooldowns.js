const { q } = require('../db');
const { GameError } = require('../core/errors');
const { duration, relative } = require('./format');

function remaining(userId, key, now = Date.now()) {
    const row = q('SELECT expires_at FROM cooldowns WHERE user_id = ? AND key = ?').get(userId, key);
    return row && row.expires_at > now ? row.expires_at - now : 0;
}

function set(userId, key, seconds, now = Date.now()) {
    q('INSERT INTO cooldowns (user_id, key, expires_at) VALUES (?, ?, ?) ON CONFLICT (user_id, key) DO UPDATE SET expires_at = excluded.expires_at')
        .run(userId, key, now + seconds * 1000);
}

/** Throws if the cooldown is running, otherwise starts it. */
function use(userId, key, seconds, what = 'that', now = Date.now()) {
    const left = remaining(userId, key, now);
    if (left > 0) {
        throw new GameError(`You can ${what} again ${relative(now + left)} (${duration(left)}).`, { title: 'Cooldown', emoji: '⏳' });
    }
    set(userId, key, seconds, now);
}

function clear(userId, key) {
    q('DELETE FROM cooldowns WHERE user_id = ? AND key = ?').run(userId, key);
}

module.exports = { remaining, set, use, clear };
