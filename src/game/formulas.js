// Pure progression formulas. No database access here so anything can import them.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const ENERGY_REGEN_MS = 60 * 1000; // +1 energy per minute
const BANK_INTEREST_DAILY = 0.005; // 0.5% per day on the insured part of the bank
const BANK_INTEREST_MAX_HOURS = 7 * 24;
const BILLION = 1_000_000_000;

/** XP needed to go from `level` to `level + 1`. */
function xpForNext(level) {
    return 5 * level * level + 50 * level + 100;
}

function maxEnergy(level) {
    return Math.min(100 + 2 * (level - 1), 250);
}

function bankCapacity(user) {
    return 25_000 + user.level * 10_000 + user.bank_bonus;
}

/** Permanent income multiplier earned by completing Project 1B. */
function prestigeMultiplier(prestige) {
    return 1 + 0.15 * prestige;
}

function levelUpReward(newLevel) {
    return 250 * newLevel;
}

function maxBet(user) {
    return (5_000 + user.level * 5_000) * (1 + user.prestige);
}

module.exports = {
    HOUR,
    DAY,
    ENERGY_REGEN_MS,
    BANK_INTEREST_DAILY,
    BANK_INTEREST_MAX_HOURS,
    BILLION,
    xpForNext,
    maxEnergy,
    bankCapacity,
    prestigeMultiplier,
    levelUpReward,
    maxBet,
};
