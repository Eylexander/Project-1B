const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const inventory = require('./inventory');
const economy = require('./economy');
const { money, itemLabel } = require('./format');
const { DAY } = require('./formulas');

// Player-to-player market. Sellers pay a small listing fee up front and a tax on each sale;
// both leave the economy (into the treasury), which keeps inflation in check.
const LISTING_FEE = 0.02;
const SALE_TAX = 0.05;
const MAX_LISTINGS = 10;
const DURATION = 7 * DAY;
const UNTRADABLE = new Set(['trophy_1b']);

function listingFee(quantity, price) {
    return Math.max(10, Math.ceil(quantity * price * LISTING_FEE));
}

function create(userId, itemId, quantity, price, now = Date.now()) {
    const item = inventory.item(itemId);
    if (UNTRADABLE.has(itemId)) throw new GameError(`${itemLabel(item)} can't be traded.`);
    if (price < 1) throw new GameError('The price must be at least $1.');
    const active = q('SELECT COUNT(*) AS c FROM market_listings WHERE seller_id = ? AND expires_at > ?').get(userId, now).c;
    if (active >= MAX_LISTINGS) throw new GameError(`You already have ${MAX_LISTINGS} listings. Cancel one first.`);
    const fee = listingFee(quantity, price);
    const id = tx(() => {
        inventory.remove(userId, itemId, quantity);
        economy.debit(userId, fee, 'market_fee', `Listing ${quantity}× ${item.name}`);
        return q('INSERT INTO market_listings (seller_id, item_id, quantity, price, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
            .run(userId, itemId, quantity, price, now, now + DURATION).lastInsertRowid;
    });
    economy.toTreasury(fee);
    return { id: Number(id), item, quantity, price, fee };
}

function get(id) {
    const row = q('SELECT l.*, u.username AS seller_name FROM market_listings l JOIN users u ON u.id = l.seller_id WHERE l.id = ?').get(id);
    return row && inventory.ITEMS[row.item_id] ? { ...row, item: inventory.ITEMS[row.item_id] } : null;
}

function browse({ itemId = null, sellerId = null, limit = 10, offset = 0 } = {}, now = Date.now()) {
    const where = ['l.expires_at > ?'];
    const args = [now];
    if (itemId) {
        where.push('l.item_id = ?');
        args.push(itemId);
    }
    if (sellerId) {
        where.push('l.seller_id = ?');
        args.push(sellerId);
    }
    const sql = `
        SELECT l.*, u.username AS seller_name FROM market_listings l JOIN users u ON u.id = l.seller_id
        WHERE ${where.join(' AND ')} ORDER BY l.price ASC, l.id ASC LIMIT ? OFFSET ?
    `;
    const rows = q(sql).all(...args, limit, offset).filter((r) => inventory.ITEMS[r.item_id]).map((r) => ({ ...r, item: inventory.ITEMS[r.item_id] }));
    const total = q(`SELECT COUNT(*) AS c FROM market_listings l WHERE ${where.join(' AND ')}`).get(...args).c;
    return { rows, total };
}

function buy(buyerId, listingId, quantity, now = Date.now()) {
    return tx(() => {
        const listing = get(listingId);
        if (!listing || listing.expires_at <= now) throw new GameError(`Listing #${listingId} doesn't exist anymore.`, { emoji: '🏷️' });
        if (listing.seller_id === buyerId) throw new GameError("You can't buy your own listing. Use `/market cancel` instead.");
        const qty = Math.min(quantity ?? listing.quantity, listing.quantity);
        const cost = qty * listing.price;
        const tax = Math.floor(cost * SALE_TAX);
        economy.debit(buyerId, cost, 'market_buy', `#${listing.id} ${qty}× ${listing.item.name}`);
        economy.credit(listing.seller_id, cost - tax, 'market_sale', `#${listing.id} ${qty}× ${listing.item.name}`);
        inventory.add(buyerId, listing.item_id, qty);
        if (qty === listing.quantity) q('DELETE FROM market_listings WHERE id = ?').run(listing.id);
        else q('UPDATE market_listings SET quantity = quantity - ? WHERE id = ?').run(qty, listing.id);
        economy.toTreasury(tax);
        return { listing, quantity: qty, cost, tax, sellerGets: cost - tax };
    });
}

function cancel(userId, listingId) {
    return tx(() => {
        const listing = get(listingId);
        if (!listing || listing.seller_id !== userId) throw new GameError(`You don't have a listing #${listingId}.`);
        q('DELETE FROM market_listings WHERE id = ?').run(listing.id);
        inventory.add(userId, listing.item_id, listing.quantity);
        return listing;
    });
}

/** Sends expired listings back to their sellers' inventories. */
function expire(now = Date.now()) {
    const expired = q('SELECT * FROM market_listings WHERE expires_at <= ?').all(now);
    tx(() => {
        for (const listing of expired) {
            if (inventory.ITEMS[listing.item_id] && q('SELECT 1 FROM users WHERE id = ?').get(listing.seller_id)) {
                inventory.add(listing.seller_id, listing.item_id, listing.quantity);
            }
            q('DELETE FROM market_listings WHERE id = ?').run(listing.id);
        }
    });
    return expired.length;
}

/** Cheapest active price per item, used as a hint when listing. */
function lowestPrice(itemId, now = Date.now()) {
    return q('SELECT MIN(price) AS p FROM market_listings WHERE item_id = ? AND expires_at > ?').get(itemId, now).p;
}

function describeListing(row) {
    return `\`#${row.id}\` ${itemLabel(row.item, row.quantity)} · **${money(row.price)}** each · by ${row.seller_name}`;
}

module.exports = { create, get, browse, buy, cancel, expire, lowestPrice, describeListing, listingFee, LISTING_FEE, SALE_TAX, MAX_LISTINGS, DURATION };
