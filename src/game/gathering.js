const { GameError } = require('../core/errors');
const { GATHERING, CHESTS } = require('../data/loot');
const inventory = require('./inventory');
const users = require('./users');
const cooldowns = require('./cooldowns');
const boosts = require('./boosts');
const economy = require('./economy');
const rng = require('./rng');
const { duration, relative } = require('./format');

const STARTER_TOOL = { fish: 'fishing_rod', mine: 'pickaxe', dig: 'shovel' };

/** Weight of a loot entry after tool tier and luck are applied. */
function weightFor(entry, { tier = 1, lucky = false } = {}) {
    const [itemId, weight] = entry;
    if (itemId === null) return weight * (tier >= 2 ? 0.5 : 1);
    const order = inventory.RARITIES[inventory.item(itemId).rarity].order;
    let w = weight;
    if (order === 0 && tier >= 2) w *= 0.5;
    if (order >= 3) w *= (tier >= 2 ? 1.8 : 1) * (lucky ? 1.5 : 1);
    return w;
}

/** Rolls a loot table `rolls` times and puts the results in the player's inventory. */
function roll(userId, table, rolls, options = {}) {
    const finds = new Map();
    for (let i = 0; i < rolls; i++) {
        const entry = rng.weighted(table, (e) => weightFor(e, options));
        if (!entry[0]) continue;
        const qty = rng.int(entry[2] ?? 1, entry[3] ?? 1);
        finds.set(entry[0], (finds.get(entry[0]) ?? 0) + qty);
    }
    const result = [...finds].map(([itemId, quantity]) => ({ item: inventory.item(itemId), quantity }));
    for (const { item, quantity } of result) inventory.add(userId, item.id, quantity);
    return result;
}

function rarityEvents(finds) {
    return {
        legendary_find: finds.filter((f) => f.item.rarity === 'legendary').length,
        mythic_find: finds.filter((f) => f.item.rarity === 'mythic').length,
    };
}

/** One /fish, /mine or /dig. */
function gather(userId, activity, now = Date.now()) {
    const def = GATHERING[activity];
    const tool = inventory.bestTool(userId, activity);
    if (!tool) {
        const starter = inventory.item(STARTER_TOOL[activity]);
        throw new GameError(`You need a ${starter.emoji} **${starter.name}** to go ${def.name.toLowerCase()}. Grab one with \`/buy item:${starter.name}\` for $${starter.buy}.`, {
            title: 'Missing tool',
            emoji: def.emoji,
        });
    }

    const left = cooldowns.remaining(userId, activity, now);
    if (left) throw new GameError(`You can ${def.verb} again ${relative(now + left)} (${duration(left)}).`, { title: 'Cooldown', emoji: '⏳' });

    if (!users.spendEnergy(userId, def.energy, now)) {
        const info = users.energyInfo(users.get(userId), now);
        throw new GameError(`You need **${def.energy}** ⚡ energy but have **${info.energy}**. You regain 1 per minute, or drink a ☕ Coffee.`, {
            title: 'Too tired',
            emoji: '🪫',
        });
    }
    cooldowns.set(userId, activity, def.cooldown, now);

    const tier = tool.item.tier ?? 1;
    const lucky = Boolean(boosts.active(userId, 'luck', now));
    const rolls = (tier >= 2 ? 2 : 1) + (rng.chance(0.25) ? 1 : 0);
    const finds = roll(userId, def.table, rolls, { tier, lucky });
    const broke = inventory.wearTool(userId, tool.item_id);
    const caught = finds.reduce((sum, f) => sum + f.quantity, 0);

    return {
        activity,
        def,
        tool: tool.item,
        finds,
        broke,
        lucky,
        flavor: finds.length ? null : rng.pick(def.nothing),
        xp: rng.int(def.xp[0], def.xp[1]) * (tier >= 2 ? 1.25 : 1),
        events: { [`${activity}_catch`]: caught, energy_spent: def.energy, ...rarityEvents(finds) },
    };
}

/** Opens one chest the player owns. */
function openChest(userId, itemId) {
    const item = inventory.item(itemId);
    const chest = CHESTS[item.use?.chest];
    if (!chest) throw new GameError(`${item.emoji} ${item.name} is not a chest.`);
    inventory.remove(userId, itemId, 1);
    const coins = rng.int(chest.coins[0], chest.coins[1]);
    economy.credit(userId, coins, 'chest', item.name);
    const finds = roll(userId, chest.table, chest.rolls);
    return { item, coins, finds, events: { chest_open: 1, ...rarityEvents(finds) } };
}

module.exports = { gather, openChest, roll, weightFor, STARTER_TOOL, GATHERING };
