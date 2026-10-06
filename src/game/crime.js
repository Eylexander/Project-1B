const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const users = require('./users');
const economy = require('./economy');
const inventory = require('./inventory');
const cooldowns = require('./cooldowns');
const boosts = require('./boosts');
const rng = require('./rng');
const { money } = require('./format');

const ROB = {
    cooldown: 30 * 60,
    victimShield: 60 * 60,
    minVictimWallet: 1_000,
    minRobberWallet: 2_000,
    baseChance: 0.45,
};

const HEIST = {
    entry: 5_000,
    joinSeconds: 60,
    maxCrew: 8,
    guildCooldown: 2 * 60 * 60 * 1000,
    userCooldown: 4 * 60 * 60,
};

const PASSIVE_COOLDOWN = 12 * 60 * 60;

function setPassive(user, enabled) {
    if (Boolean(user.passive) === enabled) throw new GameError(`Passive mode is already **${enabled ? 'on' : 'off'}**.`);
    cooldowns.use(user.id, 'passive', PASSIVE_COOLDOWN, 'toggle passive mode');
    q('UPDATE users SET passive = ?, passive_at = ? WHERE id = ?').run(enabled ? 1 : 0, Date.now(), user.id);
}

function robChance(robber, victim, { lockpick, lucky }) {
    const levelEdge = Math.max(-0.1, Math.min(0.1, (robber.level - victim.level) * 0.01));
    return Math.min(0.8, ROB.baseChance + levelEdge + (lockpick ? 0.15 : 0) + (lucky ? 0.1 : 0));
}

/**
 * One robbery attempt. Returns what happened:
 *   { outcome: 'padlock' | 'success' | 'caught', amount, chance, usedLockpick, brokePadlock }
 */
function rob(robberId, victimId, now = Date.now()) {
    if (robberId === victimId) throw new GameError("You can't rob yourself. Well, you can, but nothing happens.");
    const robber = users.get(robberId);
    const victim = users.get(victimId);
    if (!victim) throw new GameError("That person hasn't started playing yet. Leave them alone!");
    if (robber.passive) throw new GameError('You are in passive mode. Turn it off with `/passive off` to rob people.', { emoji: '🕊️' });
    if (victim.passive) throw new GameError(`**${victim.username}** is in passive mode and can't be robbed.`, { emoji: '🕊️' });
    if (robber.wallet < ROB.minRobberWallet) throw new GameError(`You need at least **${money(ROB.minRobberWallet)}** in your wallet to pay the fine if you get caught.`);
    if (victim.wallet < ROB.minVictimWallet) throw new GameError(`**${victim.username}** has less than ${money(ROB.minVictimWallet)} in their wallet. Not worth it.`);
    const shield = cooldowns.remaining(victimId, 'robbed', now);
    if (shield) throw new GameError(`**${victim.username}** was robbed recently and is on high alert.`, { emoji: '🚨' });
    cooldowns.use(robberId, 'rob', ROB.cooldown, 'rob someone', now);

    return tx(() => {
        const hasLockpick = inventory.count(robberId, 'lockpick') > 0;
        const hasPadlock = inventory.count(victimId, 'padlock') > 0;
        if (hasLockpick) inventory.remove(robberId, 'lockpick', 1);

        if (hasPadlock) {
            inventory.remove(victimId, 'padlock', 1);
            if (!hasLockpick) return { outcome: 'padlock', amount: 0, chance: 0, usedLockpick: false, victim };
        }

        const lucky = Boolean(boosts.active(robberId, 'luck', now));
        const chance = robChance(robber, victim, { lockpick: hasLockpick, lucky });
        if (rng.chance(chance)) {
            const cap = 10_000 + robber.level * 5_000;
            const amount = Math.min(Math.floor(victim.wallet * rng.float(0.1, 0.35)), cap);
            economy.debit(victimId, amount, 'robbed', `Robbed by ${robber.username}`);
            economy.credit(robberId, amount, 'rob', `Robbed ${victim.username}`);
            cooldowns.set(victimId, 'robbed', ROB.victimShield, now);
            return { outcome: 'success', amount, chance, usedLockpick: hasLockpick, brokePadlock: hasPadlock, victim };
        }
        const fine = Math.max(500, Math.floor(robber.wallet * rng.float(0.1, 0.2)));
        economy.debit(robberId, fine, 'fine', `Caught robbing ${victim.username}`);
        economy.credit(victimId, fine, 'compensation', `${robber.username} got caught robbing you`);
        return { outcome: 'caught', amount: fine, chance, usedLockpick: hasLockpick, brokePadlock: hasPadlock, victim };
    });
}

function heistChance(crewSize) {
    return Math.min(0.25 + 0.1 * (crewSize - 1), 0.75);
}

/** Resolves a heist for a crew who already paid the entry fee. */
function resolveHeist(crewIds) {
    const crew = crewIds.map((id) => users.get(id)).filter(Boolean);
    const chance = heistChance(crew.length);
    const avgLevel = crew.reduce((sum, u) => sum + u.level, 0) / crew.length;
    const success = rng.chance(chance);

    return tx(() => {
        if (success) {
            // The vault grows faster than the crew, so bringing friends always pays more per head.
            const perHead = rng.int(15_000, 40_000) * (1 + avgLevel / 10);
            const vault = Math.floor(perHead * crew.length * (1 + 0.1 * (crew.length - 1)));
            const share = Math.floor(vault / crew.length);
            for (const member of crew) economy.credit(member.id, share + HEIST.entry, 'heist', `Heist share (crew of ${crew.length})`);
            return { success, chance, vault, share, arrested: [] };
        }
        const arrested = [];
        for (const member of crew) {
            if (!rng.chance(0.3)) continue;
            const fresh = users.get(member.id);
            const bail = Math.floor(fresh.wallet * 0.1);
            if (bail > 0) economy.debit(member.id, bail, 'fine', 'Heist bail');
            economy.toTreasury(bail);
            arrested.push({ id: member.id, bail });
        }
        economy.toTreasury(HEIST.entry * crew.length);
        return { success, chance, vault: 0, share: 0, arrested };
    });
}

module.exports = { setPassive, rob, robChance, heistChance, resolveHeist, ROB, HEIST };
