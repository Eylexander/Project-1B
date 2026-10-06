const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const { money } = require('./format');
const state = require('./state');

const ACCOUNTS = new Set(['wallet', 'bank']);

// Credits of these types count towards lifetime earnings (and the "earned" stat).
const INCOME = new Set([
    'work', 'sell', 'daily', 'weekly', 'business', 'interest', 'quest', 'achievement', 'levelup',
    'chest', 'drop', 'rob', 'heist', 'gamble', 'lottery', 'market_sale', 'stock_sell', 'chat',
]);

function column(account) {
    if (!ACCOUNTS.has(account)) throw new Error(`Unknown account ${account}`);
    return account;
}

function log(userId, amount, account, type, detail = null) {
    q('INSERT INTO transactions (user_id, amount, account, type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, amount, account, type, detail, Date.now());
}

/** Adds money to a player. Amounts are always whole dollars. */
function credit(userId, amount, type, detail = null, account = 'wallet') {
    amount = Math.floor(amount);
    if (amount <= 0) return 0;
    const col = column(account);
    tx(() => {
        q(`UPDATE users SET ${col} = ${col} + ?, lifetime_earned = lifetime_earned + ? WHERE id = ?`)
            .run(amount, INCOME.has(type) ? amount : 0, userId);
        log(userId, amount, account, type, detail);
    });
    return amount;
}

/** Takes money from a player, or throws a GameError if they don't have enough. */
function debit(userId, amount, type, detail = null, account = 'wallet') {
    amount = Math.floor(amount);
    if (amount <= 0) return 0;
    const col = column(account);
    tx(() => {
        const result = q(`UPDATE users SET ${col} = ${col} - ? WHERE id = ? AND ${col} >= ?`).run(amount, userId, amount);
        if (!result.changes) {
            const have = q(`SELECT ${col} AS balance FROM users WHERE id = ?`).get(userId)?.balance ?? 0;
            throw new GameError(`You need **${money(amount)}** in your ${account} but you only have **${money(have)}**.`, {
                title: 'Not enough money',
                emoji: '💸',
            });
        }
        log(userId, -amount, account, type, detail);
    });
    return amount;
}

/** Money that leaves the economy (fees, taxes) lands in the treasury, which funds lottery seeds and heists. */
function toTreasury(amount) {
    if (amount > 0) state.increment('treasury', Math.floor(amount));
}

function fromTreasury(amount) {
    const balance = state.get('treasury', 0);
    const taken = Math.min(balance, Math.floor(amount));
    state.set('treasury', balance - taken);
    return taken;
}

module.exports = { credit, debit, log, toTreasury, fromTreasury, INCOME };
