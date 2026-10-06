const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { BUSINESSES, STORAGE_HOURS, MAX_LEVEL } = require('../data/businesses');
const economy = require('./economy');
const stats = require('./stats');
const state = require('./state');
const { HOUR, prestigeMultiplier } = require('./formulas');

function incomePerHour(def, level, prestige = 0) {
    return Math.floor(def.income * (1 + 0.6 * (level - 1)) * prestigeMultiplier(prestige));
}

function upgradeCost(def, level) {
    return Math.round((def.cost * 0.5 * 1.35 ** (level - 1)) / 100) * 100;
}

function pendingFor(row, def, prestige, now = Date.now()) {
    const elapsed = Math.min(Math.max(0, now - row.collected_at), STORAGE_HOURS * HOUR);
    return Math.floor((incomePerHour(def, row.level, prestige) * elapsed) / HOUR);
}

/** Owned businesses with their live numbers. */
function owned(userId, now = Date.now()) {
    const { prestige } = q('SELECT prestige FROM users WHERE id = ?').get(userId);
    return q('SELECT * FROM businesses WHERE user_id = ?').all(userId)
        .filter((row) => BUSINESSES[row.business_id])
        .map((row) => {
            const def = BUSINESSES[row.business_id];
            return {
                ...row,
                def,
                perHour: incomePerHour(def, row.level, prestige),
                pending: pendingFor(row, def, prestige, now),
                fullAt: row.collected_at + STORAGE_HOURS * HOUR,
                nextCost: row.level < MAX_LEVEL ? upgradeCost(def, row.level) : null,
            };
        })
        .sort((a, b) => a.def.cost - b.def.cost);
}

function find(query) {
    if (BUSINESSES[query]) return BUSINESSES[query];
    const needle = String(query).toLowerCase();
    return Object.values(BUSINESSES).find((b) => b.name.toLowerCase().includes(needle)) ?? null;
}

function buy(user, businessId, now = Date.now()) {
    const def = BUSINESSES[businessId];
    if (!def) throw new GameError('That business does not exist.');
    if (user.level < def.level) throw new GameError(`You need to be level **${def.level}** to open a ${def.emoji} ${def.name}.`);
    if (q('SELECT 1 FROM businesses WHERE user_id = ? AND business_id = ?').get(user.id, businessId)) {
        throw new GameError(`You already own a ${def.emoji} ${def.name}. Upgrade it instead!`);
    }
    tx(() => {
        economy.debit(user.id, def.cost, 'business_buy', def.name);
        q('INSERT INTO businesses (user_id, business_id, level, invested, collected_at) VALUES (?, ?, 1, ?, ?)').run(user.id, businessId, def.cost, now);
    });
    state.increment('sink_total', def.cost);
    const count = q('SELECT COUNT(*) AS c FROM businesses WHERE user_id = ?').get(user.id).c;
    return { def, count };
}

function collect(userId, now = Date.now()) {
    const rows = owned(userId, now);
    if (!rows.length) throw new GameError("You don't own any businesses yet. Start with a 🍋 Lemonade Stand: `/business buy`.");
    const total = rows.reduce((sum, row) => sum + row.pending, 0);
    if (total <= 0) throw new GameError('Nothing to collect yet. Your businesses are still working on it.', { emoji: '⏳' });
    tx(() => {
        q('UPDATE businesses SET collected_at = ? WHERE user_id = ?').run(now, userId);
        economy.credit(userId, total, 'business', 'Business income');
    });
    return { rows, total };
}

function upgrade(userId, businessId, now = Date.now()) {
    const row = owned(userId, now).find((r) => r.business_id === businessId);
    if (!row) throw new GameError("You don't own that business.");
    if (row.level >= MAX_LEVEL) throw new GameError(`${row.def.emoji} ${row.def.name} is already max level.`);
    const cost = row.nextCost;
    tx(() => {
        // Bank whatever was pending first so the new rate starts clean.
        if (row.pending > 0) economy.credit(userId, row.pending, 'business', `${row.def.name} income`);
        economy.debit(userId, cost, 'business_upgrade', `${row.def.name} → level ${row.level + 1}`);
        q('UPDATE businesses SET level = level + 1, invested = invested + ?, collected_at = ? WHERE user_id = ? AND business_id = ?')
            .run(cost, now, userId, businessId);
    });
    state.increment('sink_total', cost);
    return { def: row.def, level: row.level + 1, cost, collected: row.pending, perHour: incomePerHour(row.def, row.level + 1, q('SELECT prestige FROM users WHERE id = ?').get(userId).prestige) };
}

function trackCount(userId) {
    stats.max(userId, 'business_count', q('SELECT COUNT(*) AS c FROM businesses WHERE user_id = ?').get(userId).c);
}

module.exports = { owned, find, buy, collect, upgrade, incomePerHour, upgradeCost, trackCount, BUSINESSES, STORAGE_HOURS, MAX_LEVEL };
