const { q } = require('../db');
const { ACHIEVEMENTS } = require('../data/achievements');
const economy = require('./economy');
const stats = require('./stats');
const networth = require('./networth');
const { money } = require('./format');

const list = Object.values(ACHIEVEMENTS);

function unlocked(userId) {
    return q('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at').all(userId)
        .filter((row) => ACHIEVEMENTS[row.achievement_id])
        .map((row) => ({ ...ACHIEVEMENTS[row.achievement_id], unlockedAt: row.unlocked_at }));
}

function has(userId, id) {
    return Boolean(q('SELECT 1 FROM achievements WHERE user_id = ? AND achievement_id = ?').get(userId, id));
}

/** Unlocks an achievement once. Returns a notice line, or null if it was already unlocked. */
function grant(userId, id) {
    const achievement = ACHIEVEMENTS[id];
    if (!achievement) return null;
    const result = q('INSERT OR IGNORE INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)').run(userId, id, Date.now());
    if (!result.changes) return null;
    if (achievement.reward) economy.credit(userId, achievement.reward, 'achievement', achievement.name);
    return `🏆 **Achievement unlocked: ${achievement.emoji} ${achievement.name}**${achievement.reward ? ` (+${money(achievement.reward)})` : ''}`;
}

function grantAll(userId, candidates) {
    return candidates.map((a) => grant(userId, a.id)).filter(Boolean);
}

function checkStat(userId, key) {
    const relevant = list.filter((a) => a.stat === key);
    if (!relevant.length) return [];
    const value = stats.get(userId, key);
    return grantAll(userId, relevant.filter((a) => value >= a.threshold));
}

function checkUser(userId) {
    const user = q('SELECT level, prestige FROM users WHERE id = ?').get(userId);
    if (!user) return [];
    const worth = networth.total(userId);
    return grantAll(userId, list.filter((a) =>
        (a.level && user.level >= a.level)
        || (a.prestige && user.prestige >= a.prestige)
        || (a.networth && worth >= a.networth)));
}

module.exports = { unlocked, has, grant, checkStat, checkUser, list, ACHIEVEMENTS };
