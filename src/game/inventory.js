const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { ITEMS, RARITIES, CATEGORIES } = require('../data/items');
const { itemLabel } = require('./format');

function item(id) {
    const found = ITEMS[id];
    if (!found) throw new Error(`Unknown item ${id}`);
    return found;
}

const normalize = (text) => String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

/** Finds an item by id or (fuzzy) name. */
function findItem(query) {
    if (!query) return null;
    if (ITEMS[query]) return ITEMS[query];
    const needle = normalize(query);
    const all = Object.values(ITEMS);
    return all.find((i) => normalize(i.id) === needle || normalize(i.name) === needle)
        ?? all.find((i) => normalize(i.name).startsWith(needle))
        ?? all.find((i) => normalize(i.name).includes(needle))
        ?? null;
}

function requireItem(query) {
    const found = findItem(query);
    if (!found) throw new GameError(`I don't know any item called \`${query}\`.`, { title: 'Unknown item', emoji: '❓' });
    return found;
}

/** Autocomplete choices, optionally filtered (e.g. only what the player owns). */
function choices(query, filter = () => true, limit = 25) {
    const needle = normalize(query ?? '');
    return Object.values(ITEMS)
        .filter(filter)
        .filter((i) => !needle || normalize(i.name).includes(needle) || normalize(i.id).includes(needle))
        .slice(0, limit)
        .map((i) => ({ name: `${i.emoji} ${i.name}`.slice(0, 100), value: i.id }));
}

function count(userId, itemId) {
    return q('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId)?.quantity ?? 0;
}

function list(userId) {
    return q('SELECT item_id, quantity, durability FROM inventory WHERE user_id = ? AND quantity > 0')
        .all(userId)
        .filter((row) => ITEMS[row.item_id])
        .map((row) => ({ ...row, item: ITEMS[row.item_id] }))
        .sort((a, b) =>
            Object.keys(CATEGORIES).indexOf(a.item.category) - Object.keys(CATEGORIES).indexOf(b.item.category)
            || RARITIES[b.item.rarity].order - RARITIES[a.item.rarity].order
            || a.item.name.localeCompare(b.item.name));
}

function add(userId, itemId, quantity = 1) {
    if (quantity <= 0) return;
    const def = item(itemId);
    q(`
        INSERT INTO inventory (user_id, item_id, quantity, durability) VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id, item_id) DO UPDATE SET
            quantity = quantity + excluded.quantity,
            durability = COALESCE(durability, excluded.durability)
    `).run(userId, itemId, quantity, def.durability ?? null);
}

function remove(userId, itemId, quantity = 1) {
    if (quantity <= 0) return;
    tx(() => {
        const have = count(userId, itemId);
        if (have < quantity) {
            throw new GameError(`You only have **${have}** × ${itemLabel(item(itemId))}.`, { title: 'Not enough items', emoji: '🎒' });
        }
        if (have === quantity) q('DELETE FROM inventory WHERE user_id = ? AND item_id = ?').run(userId, itemId);
        else q('UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?').run(quantity, userId, itemId);
    });
}

/** The best tool the player owns for an activity, or null. */
function bestTool(userId, activity) {
    return list(userId)
        .filter((row) => row.item.tool === activity)
        .sort((a, b) => b.item.tier - a.item.tier)[0] ?? null;
}

/** Uses one durability point. Returns true if the tool broke. */
function wearTool(userId, itemId) {
    return tx(() => {
        const row = q('SELECT quantity, durability FROM inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
        if (!row) return false;
        const left = (row.durability ?? item(itemId).durability) - 1;
        if (left > 0) {
            q('UPDATE inventory SET durability = ? WHERE user_id = ? AND item_id = ?').run(left, userId, itemId);
            return false;
        }
        if (row.quantity <= 1) q('DELETE FROM inventory WHERE user_id = ? AND item_id = ?').run(userId, itemId);
        else q('UPDATE inventory SET quantity = quantity - 1, durability = ? WHERE user_id = ? AND item_id = ?').run(item(itemId).durability, userId, itemId);
        return true;
    });
}

/** Total sell value of everything a player holds. */
function value(userId) {
    return list(userId).reduce((sum, row) => sum + row.item.sell * row.quantity, 0);
}

module.exports = { item, findItem, requireItem, choices, count, list, add, remove, bestTool, wearTool, value, ITEMS, RARITIES, CATEGORIES };
