const state = require('./state');
const { prestigeMultiplier } = require('./formulas');

// Global events. Golden Hour doubles work pay for everyone while it lasts.

function goldenHourUntil(now = Date.now()) {
    const until = state.get('golden_hour_until', 0);
    return until > now ? until : 0;
}

function startGoldenHour(minutes = 30, now = Date.now()) {
    return state.set('golden_hour_until', Math.max(now, goldenHourUntil(now)) + minutes * 60_000);
}

/** Multiplier applied to active income (work, chat). */
function workMultiplier(user, now = Date.now()) {
    return prestigeMultiplier(user.prestige) * (goldenHourUntil(now) ? 2 : 1);
}

module.exports = { goldenHourUntil, startGoldenHour, workMultiplier };
