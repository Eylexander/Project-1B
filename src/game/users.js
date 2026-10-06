const { q, tx } = require('../db');
const F = require('./formulas');
const economy = require('./economy');

const STARTING_WALLET = 500;
const ENERGY_OVERFLOW = 2; // consumables can push energy up to 2x the max

function get(id) {
    return q('SELECT * FROM users WHERE id = ?').get(id);
}

function displayName(discordUser) {
    return discordUser.globalName || discordUser.displayName || discordUser.username || 'Unknown';
}

/**
 * Loads a player, creating their account on first contact.
 * Accepts a discord.js User (keeps the stored name fresh) or a plain id.
 */
function ensure(discordUser, now = Date.now()) {
    const id = typeof discordUser === 'string' ? discordUser : discordUser.id;
    const name = typeof discordUser === 'string' ? null : displayName(discordUser);
    let user = get(id);
    if (!user) {
        q(`
            INSERT INTO users (id, username, wallet, interest_at, energy, energy_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, name ?? 'Unknown', STARTING_WALLET, now, F.maxEnergy(1), now, now);
        economy.log(id, STARTING_WALLET, 'wallet', 'starter', 'Welcome to Project 1B');
        user = get(id);
        user.isNew = true;
        return user;
    }
    if (name && user.username !== name) {
        q('UPDATE users SET username = ? WHERE id = ?').run(name, id);
        user.username = name;
    }
    return accrueInterest(user, now);
}

/** Pays bank interest for every full hour since the last payout (up to a week while away). */
function accrueInterest(user, now = Date.now()) {
    const hours = Math.floor((now - user.interest_at) / F.HOUR);
    if (hours < 1) return user;
    const insured = Math.min(user.bank, F.bankCapacity(user));
    const interest = Math.floor(insured * (F.BANK_INTEREST_DAILY / 24) * Math.min(hours, F.BANK_INTEREST_MAX_HOURS));
    tx(() => {
        q('UPDATE users SET interest_at = interest_at + ? WHERE id = ?').run(hours * F.HOUR, user.id);
        if (interest > 0) economy.credit(user.id, interest, 'interest', `${hours}h of bank interest`, 'bank');
    });
    return get(user.id);
}

/** Energy right now, including regeneration since it was last stored. */
function energyNow(user, now = Date.now()) {
    const max = F.maxEnergy(user.level);
    if (user.energy >= max) return { energy: user.energy, energyAt: now, max };
    const ticks = Math.floor((now - user.energy_at) / F.ENERGY_REGEN_MS);
    if (user.energy + ticks >= max) return { energy: max, energyAt: now, max };
    return { energy: user.energy + ticks, energyAt: user.energy_at + ticks * F.ENERGY_REGEN_MS, max };
}

function energyInfo(user, now = Date.now()) {
    const { energy, energyAt, max } = energyNow(user, now);
    const missing = Math.max(0, max - energy);
    return {
        energy,
        max,
        nextAt: missing ? energyAt + F.ENERGY_REGEN_MS : null,
        fullAt: missing ? energyAt + missing * F.ENERGY_REGEN_MS : null,
    };
}

/** Spends energy or returns false if there isn't enough. */
function spendEnergy(userId, cost, now = Date.now()) {
    return tx(() => {
        const user = get(userId);
        const { energy, energyAt, max } = energyNow(user, now);
        if (energy < cost) return false;
        const after = energy - cost;
        q('UPDATE users SET energy = ?, energy_at = ? WHERE id = ?').run(after, energy >= max ? now : energyAt, userId);
        return true;
    });
}

/** Adds energy (from consumables). Returns how much was actually added. */
function addEnergy(userId, amount, now = Date.now()) {
    return tx(() => {
        const user = get(userId);
        const { energy, energyAt, max } = energyNow(user, now);
        const after = Math.min(energy + amount, max * ENERGY_OVERFLOW);
        q('UPDATE users SET energy = ?, energy_at = ? WHERE id = ?').run(after, energyAt, userId);
        return after - energy;
    });
}

function isBanned(userId) {
    return q('SELECT reason FROM bot_bans WHERE user_id = ?').get(userId) ?? null;
}

module.exports = { get, ensure, displayName, accrueInterest, energyInfo, spendEnergy, addEnergy, isBanned, STARTING_WALLET };
