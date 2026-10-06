const stats = require('./stats');
const quests = require('./quests');
const achievements = require('./achievements');
const leveling = require('./leveling');

/**
 * Everything that follows a player action, in one call:
 * counts the events, advances quests, gives XP, unlocks achievements.
 * Returns the notice lines to show under the command's result.
 *
 *   progress.after(userId, { xp: 25, events: { work: 1, energy_spent: 10 } })
 *   progress.after(userId, { peaks: { daily_streak: 12 } })
 */
function after(userId, { xp = 0, events = {}, peaks = {} } = {}) {
    const notices = [];
    let questXp = 0;
    let questsDone = 0;

    for (const [key, amount] of Object.entries(events)) {
        if (!amount) continue;
        stats.add(userId, key, amount);
        const result = quests.advance(userId, key, amount);
        notices.push(...result.notices);
        questXp += result.xp;
        questsDone += result.completed;
        notices.push(...achievements.checkStat(userId, key));
    }

    for (const [key, value] of Object.entries(peaks)) {
        stats.max(userId, key, value);
        notices.push(...achievements.checkStat(userId, key));
    }

    if (questsDone) {
        stats.add(userId, 'quest_complete', questsDone);
        notices.push(...achievements.checkStat(userId, 'quest_complete'));
    }

    notices.push(...leveling.addXp(userId, xp + questXp).notices);
    notices.push(...achievements.checkUser(userId));
    return notices;
}

module.exports = { after };
