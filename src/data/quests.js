// Daily quests. Every player gets 3 per UTC day. `targets` are picked by difficulty slot (easy, medium, hard).
// `event` matches the names passed to progress.track().

const QUESTS = {
    work: { text: 'Work {n} shifts', event: 'work', targets: [3, 5, 8] },
    fish: { text: 'Catch {n} fish', event: 'fish_catch', targets: [5, 10, 18] },
    mine: { text: 'Mine {n} ores', event: 'mine_catch', targets: [6, 12, 20] },
    dig: { text: 'Dig up {n} things', event: 'dig_catch', targets: [4, 8, 14] },
    gamble: { text: 'Win {n} casino games', event: 'gamble_win', targets: [2, 4, 7] },
    sell: { text: 'Sell items worth {money}', event: 'sell_value', targets: [2_000, 8_000, 20_000], money: true },
    craft: { text: 'Craft {n} items', one: 'Craft an item', event: 'craft', targets: [1, 3, 5] },
    collect: { text: 'Collect business income {n} times', one: 'Collect business income once', event: 'business_collect', targets: [1, 2, 3] },
    trade: { text: 'Make {n} stock trades', one: 'Make a stock trade', event: 'stock_trade', targets: [1, 3, 5] },
    chest: { text: 'Open {n} chests', one: 'Open a chest', event: 'chest_open', targets: [1, 2, 3] },
    energy: { text: 'Spend {n} energy', event: 'energy_spent', targets: [40, 80, 140] },
};

// Bonus for finishing all three quests in a day.
const ALL_DONE_REWARD = { item: 'rare_chest', quantity: 1 };

module.exports = { QUESTS, ALL_DONE_REWARD };
