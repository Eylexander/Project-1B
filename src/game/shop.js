const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { RECIPES } = require('../data/recipes');
const inventory = require('./inventory');
const economy = require('./economy');
const users = require('./users');
const boosts = require('./boosts');
const state = require('./state');
const gathering = require('./gathering');
const rng = require('./rng');
const { money, itemLabel, relative } = require('./format');

const MAX_STACK_BUY = 1_000;

// Bulk-sell groups offered next to items in /sell's autocomplete.
const SELL_GROUPS = {
    '@loot': { name: 'All loot (fish, ores, relics)', categories: ['fish', 'ore', 'relic'] },
    '@fish': { name: 'All fish', categories: ['fish'] },
    '@ore': { name: 'All ores & gems', categories: ['ore'] },
    '@relic': { name: 'All relics', categories: ['relic'] },
    '@junk': { name: 'All junk', rarities: ['junk'] },
};

function shopItems() {
    return Object.values(inventory.ITEMS).filter((item) => item.buy);
}

function buy(userId, itemId, quantity) {
    const item = inventory.item(itemId);
    if (!item.buy) throw new GameError(`${itemLabel(item)} isn't sold in the shop. Try the player \`/market\`.`);
    if (quantity > MAX_STACK_BUY) throw new GameError(`You can buy at most ${MAX_STACK_BUY} at once.`);
    const cost = item.buy * quantity;
    tx(() => {
        economy.debit(userId, cost, 'buy', `${quantity}× ${item.name}`);
        inventory.add(userId, item.id, quantity);
    });
    state.increment('sink_total', cost);
    return { item, quantity, cost };
}

function sell(userId, itemId, quantity) {
    const item = inventory.item(itemId);
    if (!item.sell) throw new GameError(`${itemLabel(item)} can't be sold.`);
    const income = item.sell * quantity;
    tx(() => {
        inventory.remove(userId, item.id, quantity);
        economy.credit(userId, income, 'sell', `${quantity}× ${item.name}`);
    });
    return { lines: [{ item, quantity, income }], total: income };
}

function sellGroup(userId, groupId) {
    const group = SELL_GROUPS[groupId];
    const rows = inventory.list(userId).filter((row) =>
        row.item.sell > 0
        && (!group.categories || group.categories.includes(row.item.category))
        && (!group.rarities || group.rarities.includes(row.item.rarity)));
    if (!rows.length) throw new GameError(`You have nothing to sell in **${group.name}**.`, { emoji: '🎒' });
    return tx(() => {
        const lines = rows.map((row) => {
            inventory.remove(userId, row.item_id, row.quantity);
            return { item: row.item, quantity: row.quantity, income: row.item.sell * row.quantity };
        });
        const total = lines.reduce((sum, l) => sum + l.income, 0);
        economy.credit(userId, total, 'sell', group.name);
        return { lines, total };
    });
}

/** Uses one consumable. Returns { text, events }. */
function use(userId, itemId) {
    const item = inventory.item(itemId);
    const effect = item.use;
    if (!effect) throw new GameError(`${itemLabel(item)} can't be used like that.${item.id === 'padlock' || item.id === 'lockpick' ? ' It works automatically when needed.' : ''}`);
    if (inventory.count(userId, itemId) < 1) throw new GameError(`You don't have a ${itemLabel(item)}.`);

    if (effect.chest) {
        const opened = gathering.openChest(userId, itemId);
        return { opened, events: opened.events };
    }

    return tx(() => {
        inventory.remove(userId, itemId, 1);
        if (effect.energy) {
            const added = users.addEnergy(userId, effect.energy);
            return { text: `${item.emoji} You used **${item.name}** and gained **${added}** ⚡ energy.`, events: {} };
        }
        if (effect.boost) {
            const until = boosts.activate(userId, effect.boost, effect.minutes);
            return { text: `${item.emoji} **${item.name}** is active until ${relative(until)}.`, events: {} };
        }
        if (effect.bank) {
            const user = users.get(userId);
            const bonus = 20_000 + user.level * 2_000;
            q('UPDATE users SET bank_bonus = bank_bonus + ? WHERE id = ?').run(bonus, userId);
            return { text: `${item.emoji} Your bank capacity grew by **${money(bonus)}**.`, events: {} };
        }
        if (effect.map) {
            const chestId = rng.chance(0.25) ? 'legendary_chest' : 'rare_chest';
            inventory.add(userId, chestId, 1);
            return { text: `${item.emoji} You followed the map and dug up a ${itemLabel(inventory.item(chestId))}! Open it with \`/use\`.`, events: {} };
        }
        throw new GameError(`${itemLabel(item)} can't be used.`);
    });
}

function recipeFor(query) {
    if (RECIPES[query]) return RECIPES[query];
    const item = inventory.findItem(query);
    return item ? Object.values(RECIPES).find((r) => r.output[0] === item.id) ?? null : null;
}

/** How many times the player can craft a recipe with what they own. */
function craftable(userId, recipe) {
    return Math.min(...Object.entries(recipe.inputs).map(([id, qty]) => Math.floor(inventory.count(userId, id) / qty)));
}

function craft(userId, recipe, times, level) {
    if (level < recipe.level) throw new GameError(`You need to be level **${recipe.level}** to craft this.`);
    const max = craftable(userId, recipe);
    if (max < times) {
        const missing = Object.entries(recipe.inputs)
            .map(([id, qty]) => ({ item: inventory.item(id), need: qty * times, have: inventory.count(userId, id) }))
            .filter((m) => m.have < m.need)
            .map((m) => `${itemLabel(m.item)}: ${m.have}/${m.need}`);
        throw new GameError(`Missing ingredients:\n${missing.join('\n')}`, { title: 'Cannot craft', emoji: '⚒️' });
    }
    const [outputId, outputQty] = recipe.output;
    tx(() => {
        for (const [id, qty] of Object.entries(recipe.inputs)) inventory.remove(userId, id, qty * times);
        inventory.add(userId, outputId, outputQty * times);
    });
    return { item: inventory.item(outputId), quantity: outputQty * times };
}

module.exports = { shopItems, buy, sell, sellGroup, use, recipeFor, craftable, craft, SELL_GROUPS, RECIPES, MAX_STACK_BUY };
