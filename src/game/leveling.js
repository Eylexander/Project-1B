const { q, tx } = require('../db');
const F = require('./formulas');
const economy = require('./economy');
const boosts = require('./boosts');
const { money } = require('./format');
const { JOBS } = require('../data/jobs');
const { BUSINESSES } = require('../data/businesses');

/** What becomes available exactly at `level` (jobs and businesses). */
function unlocksAt(level) {
    return [
        ...Object.values(JOBS).filter((j) => j.level === level).map((j) => `${j.emoji} ${j.name} job`),
        ...Object.values(BUSINESSES).filter((b) => b.level === level).map((b) => `${b.emoji} ${b.name}`),
    ];
}

/** Gives XP (doubled by an XP Potion) and handles level-ups. */
function addXp(userId, amount) {
    if (amount <= 0) return { gained: 0, levels: [], notices: [] };
    const gained = Math.floor(amount * (boosts.active(userId, 'xp') ? 2 : 1));

    const levels = tx(() => {
        const user = q('SELECT xp, level FROM users WHERE id = ?').get(userId);
        let { xp, level } = user;
        const reached = [];
        xp += gained;
        while (xp >= F.xpForNext(level)) {
            xp -= F.xpForNext(level);
            level += 1;
            reached.push(level);
        }
        q('UPDATE users SET xp = ?, level = ? WHERE id = ?').run(xp, level, userId);
        for (const lvl of reached) economy.credit(userId, F.levelUpReward(lvl), 'levelup', `Reached level ${lvl}`);
        return reached;
    });

    const notices = [];
    if (levels.length) {
        const top = levels[levels.length - 1];
        const reward = levels.reduce((sum, lvl) => sum + F.levelUpReward(lvl), 0);
        notices.push(`⬆️ **Level ${top}!** You earned **${money(reward)}** and your max energy is now **${F.maxEnergy(top)}**.`);
        const unlocked = levels.flatMap(unlocksAt);
        if (unlocked.length) notices.push(`🔓 Unlocked: ${unlocked.join(', ')}`);
    }
    return { gained, levels, notices };
}

module.exports = { addXp, unlocksAt };
