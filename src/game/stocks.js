const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { STOCKS, NEWS } = require('../data/stocks');
const economy = require('./economy');
const rng = require('./rng');
const { cents: fmtCents } = require('./format');

const TICK_MS = 5 * 60 * 1000;
const FEE = 0.005; // 0.5% per trade, goes to the treasury
const HISTORY_KEEP_MS = 3 * 24 * 60 * 60 * 1000;
const NEWS_CHANCE = 0.03;
const REVERSION = 0.015;
const FAIR_DRIFT = 0.00002;

/** Adds any stock from the data file that isn't in the database yet. */
function seed(now = Date.now()) {
    const insert = q('INSERT OR IGNORE INTO stocks (symbol, price, fair, open_price, updated_at) VALUES (?, ?, ?, ?, ?)');
    const history = q('INSERT OR IGNORE INTO stock_history (symbol, ts, price) VALUES (?, ?, ?)');
    tx(() => {
        for (const stock of Object.values(STOCKS)) {
            const price = Math.round(stock.price * 100);
            if (insert.run(stock.symbol, price, price, price, now).changes) history.run(stock.symbol, now, price);
        }
    });
}

function decorate(row) {
    return { ...row, def: STOCKS[row.symbol], change: row.open_price ? row.price / row.open_price - 1 : 0 };
}

function all() {
    return q('SELECT * FROM stocks').all().filter((r) => STOCKS[r.symbol]).map(decorate);
}

function find(query) {
    const symbol = String(query ?? '').toUpperCase().replace(/^\$/, '');
    let row = q('SELECT * FROM stocks WHERE symbol = ?').get(symbol);
    if (!row) {
        const match = Object.values(STOCKS).find((s) => s.name.toLowerCase().includes(String(query).toLowerCase()));
        if (match) row = q('SELECT * FROM stocks WHERE symbol = ?').get(match.symbol);
    }
    if (!row || !STOCKS[row.symbol]) throw new GameError(`No stock called \`${query}\`. See \`/stocks market\`.`, { emoji: '📉' });
    return decorate(row);
}

function history(symbol, points = 48) {
    return q('SELECT price FROM stock_history WHERE symbol = ? ORDER BY ts DESC LIMIT ?').all(symbol, points).map((r) => r.price).reverse();
}

function latestNews(limit = 5, symbol = null) {
    return symbol
        ? q('SELECT * FROM stock_news WHERE symbol = ? ORDER BY id DESC LIMIT ?').all(symbol, limit)
        : q('SELECT * FROM stock_news ORDER BY id DESC LIMIT ?').all(limit);
}

function headline(symbol, up) {
    const special = NEWS.special[symbol];
    if (special && rng.chance(0.5)) return up ? special.up : special.down;
    return rng.pick(up ? NEWS.up : NEWS.down).replace('{name}', STOCKS[symbol].name);
}

/**
 * Moves every price one step: noise + pull towards a slowly drifting fair value,
 * plus the occasional news shock that moves both.
 */
function tick(now = Date.now()) {
    const rows = q('SELECT * FROM stocks').all().filter((r) => STOCKS[r.symbol]);
    const newsTarget = rng.chance(NEWS_CHANCE) ? rng.pick(rows)?.symbol : null;
    const news = [];
    const update = q('UPDATE stocks SET price = ?, fair = ?, updated_at = ? WHERE symbol = ?');
    const history = q('INSERT OR REPLACE INTO stock_history (symbol, ts, price) VALUES (?, ?, ?)');

    tx(() => {
        for (const row of rows) {
            const { vol } = STOCKS[row.symbol];
            let fair = row.fair * Math.exp(FAIR_DRIFT + vol * 0.25 * rng.gaussian());
            let price = row.price * Math.exp(REVERSION * Math.log(fair / row.price) + vol * rng.gaussian() - (vol * vol) / 2);
            if (row.symbol === newsTarget) {
                const up = rng.chance(0.5);
                const shock = rng.float(0.04, 0.15) * (up ? 1 : -1);
                price *= 1 + shock;
                fair *= 1 + shock * 0.7;
                const text = headline(row.symbol, up);
                q('INSERT INTO stock_news (symbol, headline, change, created_at) VALUES (?, ?, ?, ?)').run(row.symbol, text, shock, now);
                news.push({ symbol: row.symbol, headline: text, change: shock });
            }
            // Prices are cents, kept to 1/100 of a cent so cheap stocks (1B Coin) don't get stuck on rounding.
            price = Math.max(1, Math.round(price * 100) / 100);
            fair = Math.max(1, Math.round(fair * 100) / 100);
            update.run(price, fair, now, row.symbol);
            history.run(row.symbol, now, price);
        }
        q('DELETE FROM stock_history WHERE ts < ?').run(now - HISTORY_KEEP_MS);
        q('DELETE FROM stock_news WHERE created_at < ?').run(now - 7 * HISTORY_KEEP_MS);
    });
    return news;
}

/** Resets the "today" reference price, called at midnight UTC. */
function newTradingDay() {
    q('UPDATE stocks SET open_price = price').run();
}

function holding(userId, symbol) {
    return q('SELECT * FROM holdings WHERE user_id = ? AND symbol = ?').get(userId, symbol) ?? { shares: 0, cost: 0 };
}

/** Max shares affordable with a wallet balance, fee included. */
function affordable(stock, wallet) {
    return Math.floor((wallet * 100) / (stock.price * (1 + FEE)));
}

function buy(userId, symbol, shares) {
    const stock = find(symbol);
    const costCents = stock.price * shares;
    const fee = Math.ceil((costCents * FEE) / 100);
    const total = Math.ceil(costCents / 100) + fee;
    tx(() => {
        economy.debit(userId, total, 'stock_buy', `${shares} ${stock.symbol} @ ${fmtCents(stock.price)}`);
        q(`
            INSERT INTO holdings (user_id, symbol, shares, cost) VALUES (?, ?, ?, ?)
            ON CONFLICT (user_id, symbol) DO UPDATE SET shares = shares + excluded.shares, cost = cost + excluded.cost
        `).run(userId, stock.symbol, shares, costCents);
    });
    economy.toTreasury(fee);
    return { stock, shares, total, fee };
}

function sell(userId, symbol, shares) {
    const stock = find(symbol);
    const owned = holding(userId, stock.symbol);
    if (owned.shares < shares) throw new GameError(`You only own **${owned.shares}** ${stock.symbol} shares.`, { emoji: '📉' });
    const proceedsCents = stock.price * shares;
    const fee = Math.ceil((proceedsCents * FEE) / 100);
    const total = Math.floor(proceedsCents / 100) - fee;
    const basis = Math.round((owned.cost * shares) / owned.shares);
    tx(() => {
        if (owned.shares === shares) q('DELETE FROM holdings WHERE user_id = ? AND symbol = ?').run(userId, stock.symbol);
        else q('UPDATE holdings SET shares = shares - ?, cost = cost - ? WHERE user_id = ? AND symbol = ?').run(shares, basis, userId, stock.symbol);
        economy.credit(userId, total, 'stock_sell', `${shares} ${stock.symbol} @ ${fmtCents(stock.price)}`);
    });
    economy.toTreasury(fee);
    return { stock, shares, total, fee, profit: total - Math.ceil(basis / 100) };
}

function portfolio(userId) {
    return q('SELECT h.*, s.price, s.open_price FROM holdings h JOIN stocks s ON s.symbol = h.symbol WHERE h.user_id = ? ORDER BY h.shares * s.price DESC')
        .all(userId)
        .filter((r) => STOCKS[r.symbol])
        .map((r) => ({ ...r, def: STOCKS[r.symbol], value: Math.floor((r.shares * r.price) / 100), profit: Math.floor((r.shares * r.price - r.cost) / 100) }));
}

module.exports = { seed, all, find, history, latestNews, tick, newTradingDay, holding, affordable, buy, sell, portfolio, TICK_MS, FEE, STOCKS };
