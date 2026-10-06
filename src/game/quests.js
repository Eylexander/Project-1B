const { q, tx } = require('../db');
const { QUESTS, ALL_DONE_REWARD } = require('../data/quests');
const economy = require('./economy');
const inventory = require('./inventory');
const rng = require('./rng');
const { money, num, itemLabel } = require('./format');

const SLOTS = 3;

function today(now = Date.now()) {
    return new Date(now).toISOString().slice(0, 10);
}

function nextReset(now = Date.now()) {
    const date = new Date(now);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
}

function describe(row) {
    const def = QUESTS[row.quest_id];
    if (row.target === 1 && def.one) return def.one;
    return def.text.replace('{n}', num(row.target)).replace('{money}', money(row.target));
}

/** Today's quests for a player, rolled on first look. */
function forToday(userId, now = Date.now()) {
    const day = today(now);
    let rows = q('SELECT * FROM quests WHERE user_id = ? AND day = ? ORDER BY slot').all(userId, day);
    if (rows.length) return rows;

    const { level } = q('SELECT level FROM users WHERE id = ?').get(userId);
    const picks = rng.shuffle(Object.keys(QUESTS)).slice(0, SLOTS);
    const insert = q(`
        INSERT OR IGNORE INTO quests (user_id, day, slot, quest_id, target, reward_money, reward_xp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    tx(() => {
        picks.forEach((questId, slot) => {
            const rewardMoney = Math.round(((800 + 900 * slot) * (1 + 0.12 * (level - 1))) / 50) * 50;
            const rewardXp = 40 + 30 * slot + level * 3;
            insert.run(userId, day, slot, questId, QUESTS[questId].targets[slot], rewardMoney, rewardXp);
        });
    });
    rows = q('SELECT * FROM quests WHERE user_id = ? AND day = ? ORDER BY slot').all(userId, day);
    return rows;
}

/**
 * Moves today's quests forward for an event. Rewards are paid on completion.
 * Returns { notices, completed, xp } so the caller can hand out the XP.
 */
function advance(userId, event, amount, now = Date.now()) {
    const result = { notices: [], completed: 0, xp: 0 };
    const relevant = Object.entries(QUESTS).filter(([, def]) => def.event === event).map(([id]) => id);
    if (!relevant.length) return result;

    const rows = forToday(userId, now).filter((row) => relevant.includes(row.quest_id) && !row.completed_at);
    for (const row of rows) {
        const progress = Math.min(row.target, row.progress + amount);
        const done = progress >= row.target;
        q('UPDATE quests SET progress = ?, completed_at = ? WHERE user_id = ? AND day = ? AND slot = ?')
            .run(progress, done ? now : null, userId, row.day, row.slot);
        if (!done) continue;
        economy.credit(userId, row.reward_money, 'quest', describe(row));
        result.completed += 1;
        result.xp += row.reward_xp;
        result.notices.push(`🎯 **Quest complete:** ${describe(row)} (+${money(row.reward_money)}, +${row.reward_xp} XP)`);
    }

    if (result.completed) {
        const open = q('SELECT COUNT(*) AS c FROM quests WHERE user_id = ? AND day = ? AND completed_at IS NULL').get(userId, today(now)).c;
        if (open === 0) {
            inventory.add(userId, ALL_DONE_REWARD.item, ALL_DONE_REWARD.quantity);
            result.notices.push(`🌟 **All daily quests done!** Bonus: ${itemLabel(inventory.item(ALL_DONE_REWARD.item), ALL_DONE_REWARD.quantity)}`);
        }
    }
    return result;
}

module.exports = { forToday, advance, describe, today, nextReset, SLOTS };
