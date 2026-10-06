const { q } = require('../db');

const BOOSTS = {
    luck: { name: 'Luck', emoji: '🍀' },
    xp: { name: 'Double XP', emoji: '🧪' },
};

function active(userId, boost, now = Date.now()) {
    const row = q('SELECT expires_at FROM boosts WHERE user_id = ? AND boost = ?').get(userId, boost);
    return row && row.expires_at > now ? row.expires_at : 0;
}

/** Starts a boost, or extends it if one is already running. Returns the new expiry. */
function activate(userId, boost, minutes, now = Date.now()) {
    const base = Math.max(now, active(userId, boost, now));
    const expires = base + minutes * 60_000;
    q('INSERT INTO boosts (user_id, boost, expires_at) VALUES (?, ?, ?) ON CONFLICT (user_id, boost) DO UPDATE SET expires_at = excluded.expires_at')
        .run(userId, boost, expires);
    return expires;
}

function list(userId, now = Date.now()) {
    return q('SELECT boost, expires_at FROM boosts WHERE user_id = ? AND expires_at > ?')
        .all(userId, now)
        .filter((row) => BOOSTS[row.boost])
        .map((row) => ({ ...BOOSTS[row.boost], id: row.boost, expiresAt: row.expires_at }));
}

module.exports = { active, activate, list, BOOSTS };
