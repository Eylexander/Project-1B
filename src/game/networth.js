const { q } = require('../db');

// Net worth = wallet + bank + stocks at market price + half of what was invested in businesses.
// Inventory is left out on purpose: it would make hoarding stones count as wealth.

const BUSINESS_VALUE_RATIO = 0.5;

function breakdown(userId) {
    const user = q('SELECT wallet, bank FROM users WHERE id = ?').get(userId) ?? { wallet: 0, bank: 0 };
    const stocks = Math.floor(
        (q('SELECT COALESCE(SUM(h.shares * s.price), 0) AS v FROM holdings h JOIN stocks s ON s.symbol = h.symbol WHERE h.user_id = ?').get(userId).v) / 100,
    );
    const businesses = Math.floor(q('SELECT COALESCE(SUM(invested), 0) AS v FROM businesses WHERE user_id = ?').get(userId).v * BUSINESS_VALUE_RATIO);
    return { wallet: user.wallet, bank: user.bank, stocks, businesses, total: user.wallet + user.bank + stocks + businesses };
}

function total(userId) {
    return breakdown(userId).total;
}

const RANKINGS = {
    networth: 'u.wallet + u.bank + COALESCE(st.v, 0) + COALESCE(b.v, 0)',
    wallet: 'u.wallet',
    bank: 'u.bank',
    level: 'u.level * 1000000000 + u.xp',
    prestige: 'u.prestige * 1000000000000 + u.wallet + u.bank',
    earned: 'u.lifetime_earned',
};

/** Ranked players. `ids` limits the ranking to a set of players (e.g. members of one server). */
function ranking(kind = 'networth', { ids = null, limit = 10, offset = 0 } = {}) {
    const score = RANKINGS[kind] ?? RANKINGS.networth;
    const filter = ids ? `WHERE u.id IN (SELECT value FROM json_each(?))` : '';
    const sql = `
        SELECT u.id, u.username, u.level, u.prestige, u.legacy,
               u.wallet + u.bank + COALESCE(st.v, 0) + COALESCE(b.v, 0) AS networth,
               ${score} AS score
        FROM users u
        LEFT JOIN (SELECT h.user_id, SUM(h.shares * s.price) / 100 AS v FROM holdings h JOIN stocks s ON s.symbol = h.symbol GROUP BY h.user_id) st ON st.user_id = u.id
        LEFT JOIN (SELECT user_id, SUM(invested) * ${BUSINESS_VALUE_RATIO} AS v FROM businesses GROUP BY user_id) b ON b.user_id = u.id
        ${filter}
        ORDER BY score DESC, u.id ASC
        LIMIT ? OFFSET ?
    `;
    const args = ids ? [JSON.stringify(ids), limit, offset] : [limit, offset];
    return q(sql).all(...args).map((row) => ({ ...row, networth: Math.floor(row.networth), score: Math.floor(row.score) }));
}

function count(ids = null) {
    if (!ids) return q('SELECT COUNT(*) AS c FROM users').get().c;
    return q('SELECT COUNT(*) AS c FROM users WHERE id IN (SELECT value FROM json_each(?))').get(JSON.stringify(ids)).c;
}

/** 1-based position of a player in a ranking. */
function rankOf(userId, kind = 'networth', ids = null) {
    const all = ranking(kind, { ids, limit: 1_000_000 });
    const index = all.findIndex((row) => row.id === userId);
    return index === -1 ? null : index + 1;
}

module.exports = { breakdown, total, ranking, count, rankOf, RANKINGS };
