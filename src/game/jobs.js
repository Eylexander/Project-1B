const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { JOBS, UNEMPLOYED } = require('../data/jobs');
const inventory = require('./inventory');
const cooldowns = require('./cooldowns');
const events = require('./events');
const rng = require('./rng');

const SHIFT_ENERGY = 10;
const MAX_SHIFTS = 5;
const JOB_CHANGE_COOLDOWN = 60 * 60; // seconds

const PERFORMANCE = {
    great: { multiplier: 1.3, xp: 1.5, label: 'Great shift!', emoji: '🌟' },
    ok: { multiplier: 1, xp: 1, label: 'Solid shift.', emoji: '👍' },
    sloppy: { multiplier: 0.7, xp: 0.8, label: 'Sloppy shift...', emoji: '😬' },
    slacked: { multiplier: 0.5, xp: 0.5, label: 'You slacked off.', emoji: '😴' },
};

function jobOf(user) {
    const job = user.job_id ? JOBS[user.job_id] : null;
    if (!job) return { job: UNEMPLOYED, tier: UNEMPLOYED.tiers[0], tierIndex: 0 };
    const tierIndex = Math.min(user.job_tier, job.tiers.length - 1);
    return { job, tier: job.tiers[tierIndex], tierIndex };
}

function businessCount(userId) {
    return q('SELECT COUNT(*) AS c FROM businesses WHERE user_id = ?').get(userId).c;
}

/** Why a player can't take a job, or null if they can. */
function blocker(user, job) {
    if (user.level < job.level) return `You need to be level **${job.level}** (you are ${user.level}).`;
    if (job.requiresItem && inventory.count(user.id, job.requiresItem) < 1) {
        const item = inventory.item(job.requiresItem);
        return `You need a ${item.emoji} **${item.name}** for this job.`;
    }
    if (job.requiresBusinesses && businessCount(user.id) < job.requiresBusinesses) {
        return `You need to own at least **${job.requiresBusinesses}** businesses.`;
    }
    return null;
}

function join(user, jobId) {
    const job = JOBS[jobId];
    if (!job) throw new GameError('That job does not exist. See `/job list`.');
    if (user.job_id === jobId) throw new GameError(`You already work as a **${job.name}**.`);
    const reason = blocker(user, job);
    if (reason) throw new GameError(reason, { title: `Can't become a ${job.name}`, emoji: '🚫' });
    if (user.job_id) cooldowns.use(user.id, 'job_change', JOB_CHANGE_COOLDOWN, 'change jobs');
    else cooldowns.set(user.id, 'job_change', JOB_CHANGE_COOLDOWN);
    q('UPDATE users SET job_id = ?, job_tier = 0, job_shifts = 0 WHERE id = ?').run(jobId, user.id);
    return job;
}

function quit(user) {
    if (!user.job_id) throw new GameError("You don't have a job to quit.");
    const job = JOBS[user.job_id];
    q('UPDATE users SET job_id = NULL, job_tier = 0, job_shifts = 0 WHERE id = ?').run(user.id);
    return job;
}

/** The next promotion and what is missing for it, or null at the top tier. */
function nextPromotion(user) {
    const { job, tierIndex } = jobOf(user);
    const next = job.tiers[tierIndex + 1];
    if (!user.job_id || !next) return null;
    return { tier: next, shiftsLeft: Math.max(0, next.shifts - user.job_shifts), levelNeeded: next.level };
}

/**
 * Pays for `shifts` shifts at the given performance.
 * The caller has already taken the energy.
 */
function completeShifts(userId, shifts, performance) {
    return tx(() => {
        const user = q('SELECT * FROM users WHERE id = ?').get(userId);
        const { job, tier } = jobOf(user);
        const perf = PERFORMANCE[performance];
        const levelBonus = 1 + 0.03 * (user.level - 1);
        const swing = job.volatile ? rng.float(0.3, 2.4) : rng.float(0.9, 1.15);
        const pay = Math.round(tier.pay * shifts * perf.multiplier * levelBonus * swing * events.workMultiplier(user));
        const xp = Math.round((18 + user.level * 1.5) * shifts * perf.xp);

        q('UPDATE users SET job_shifts = job_shifts + ? WHERE id = ?').run(user.job_id ? shifts : 0, userId);

        // Promotions happen automatically once requirements are met.
        let promotedTo = null;
        const after = q('SELECT * FROM users WHERE id = ?').get(userId);
        const next = nextPromotion(after);
        if (next && next.shiftsLeft === 0 && after.level >= next.levelNeeded) {
            q('UPDATE users SET job_tier = job_tier + 1 WHERE id = ?').run(userId);
            promotedTo = next.tier;
        }
        return { job, tier, pay, xp, perf, swing, promotedTo };
    });
}

module.exports = { jobOf, blocker, join, quit, nextPromotion, completeShifts, JOBS, UNEMPLOYED, PERFORMANCE, SHIFT_ENERGY, MAX_SHIFTS };
