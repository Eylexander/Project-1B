const { q, tx } = require('../db');
const { GameError } = require('../core/errors');
const networth = require('./networth');
const inventory = require('./inventory');
const economy = require('./economy');
const { BILLION, prestigeMultiplier } = require('./formulas');
const { compact } = require('./format');

/** What a prestige would cost and give. */
function preview(user) {
    const worth = networth.total(user.id);
    return {
        worth,
        ready: worth >= BILLION,
        next: user.prestige + 1,
        multiplierNow: prestigeMultiplier(user.prestige),
        multiplierNext: prestigeMultiplier(user.prestige + 1),
        startingCash: 10_000 * (user.prestige + 1),
    };
}

/**
 * Completes Project 1B: wipes money, stocks, businesses, listings and items (collectibles stay),
 * keeps level, job and achievements, and makes every future paycheck bigger.
 */
function prestige(user) {
    const info = preview(user);
    if (!info.ready) throw new GameError(`You need a net worth of **${compact(BILLION)}** to prestige. You're at **${compact(info.worth)}**.`, { emoji: '🏆' });
    tx(() => {
        q('DELETE FROM holdings WHERE user_id = ?').run(user.id);
        q('DELETE FROM businesses WHERE user_id = ?').run(user.id);
        q('DELETE FROM market_listings WHERE seller_id = ?').run(user.id);
        q(`DELETE FROM inventory WHERE user_id = ? AND item_id NOT IN (${Object.values(inventory.ITEMS).filter((i) => i.category === 'collectible').map(() => '?').join(',')})`)
            .run(user.id, ...Object.values(inventory.ITEMS).filter((i) => i.category === 'collectible').map((i) => i.id));
        q('UPDATE users SET wallet = 0, bank = 0, bank_bonus = 0, prestige = prestige + 1 WHERE id = ?').run(user.id);
        economy.log(user.id, -(info.worth), 'wallet', 'prestige', `Prestige ${info.next}: reset ${info.worth}`);
        economy.credit(user.id, info.startingCash, 'prestige_bonus', `Prestige ${info.next} starting cash`);
        inventory.add(user.id, 'trophy_1b', 1);
    });
    return info;
}

module.exports = { preview, prestige };
