// Weighted loot tables: [itemId, weight, minQty, maxQty]. `null` means nothing.
// Tier 2 tools and luck boosts scale up the weight of rare-and-above entries (see game/gathering.js).

const GATHERING = {
    fish: {
        name: 'Fishing',
        verb: 'cast your line',
        emoji: '🎣',
        energy: 5,
        cooldown: 20,
        xp: [8, 16],
        nothing: ['The fish got away. Classic.', 'You caught... seaweed. You throw it back.'],
        table: [
            [null, 8],
            ['old_boot', 10, 1, 1],
            ['sardine', 30, 1, 3],
            ['shrimp', 22, 1, 3],
            ['tropical_fish', 14, 1, 2],
            ['crab', 10, 1, 2],
            ['pufferfish', 5, 1, 1],
            ['squid', 4, 1, 1],
            ['octopus', 1.6, 1, 1],
            ['shark', 0.9, 1, 1],
            ['golden_koi', 0.12, 1, 1],
            ['leviathan_scale', 0.012, 1, 1],
        ],
    },
    mine: {
        name: 'Mining',
        verb: 'swing your pickaxe',
        emoji: '⛏️',
        energy: 8,
        cooldown: 25,
        xp: [10, 20],
        nothing: ['Your pickaxe bounced off. Ouch.', 'Just dust in this tunnel.'],
        table: [
            [null, 5],
            ['stone', 22, 2, 5],
            ['coal', 26, 1, 4],
            ['iron_ore', 22, 1, 3],
            ['gold_ore', 10, 1, 2],
            ['amethyst', 5, 1, 1],
            ['diamond', 1.4, 1, 1],
            ['carpathian_crystal', 0.15, 1, 1],
            ['meteorite', 0.01, 1, 1],
        ],
    },
    dig: {
        name: 'Digging',
        verb: 'dig a hole',
        emoji: '🪏',
        energy: 6,
        cooldown: 25,
        xp: [9, 18],
        nothing: ['Just dirt. Lots of dirt.', 'You hit a pipe and quickly fill the hole back in.'],
        table: [
            [null, 8],
            ['worm', 14, 1, 3],
            ['potato', 24, 1, 4],
            ['bone', 18, 1, 2],
            ['ancient_coin', 12, 1, 2],
            ['fossil', 4.5, 1, 1],
            ['treasure_map', 1.6, 1, 1],
            ['common_chest', 2, 1, 1],
            ['amphora', 1.2, 1, 1],
            ['stone_head', 0.13, 1, 1],
            ['lost_vinyl', 0.012, 1, 1],
        ],
    },
};

// What opening a chest gives: a coin range plus a few rolls on a table.
const CHESTS = {
    common: {
        coins: [400, 1_200],
        rolls: 2,
        table: [
            ['coffee', 30, 1, 2],
            ['energy_drink', 12, 1, 1],
            ['sardine', 20, 2, 5],
            ['iron_ore', 18, 2, 4],
            ['ancient_coin', 12, 1, 2],
            ['padlock', 5, 1, 1],
            ['rare_chest', 1.5, 1, 1],
        ],
    },
    rare: {
        coins: [3_000, 9_000],
        rolls: 3,
        table: [
            ['energy_drink', 25, 1, 2],
            ['gold_ore', 18, 2, 4],
            ['amethyst', 14, 1, 2],
            ['lockpick', 10, 1, 1],
            ['padlock', 10, 1, 1],
            ['lucky_clover', 6, 1, 1],
            ['xp_potion', 5, 1, 1],
            ['diamond', 4, 1, 1],
            ['treasure_map', 5, 1, 1],
            ['legendary_chest', 1, 1, 1],
        ],
    },
    legendary: {
        coins: [25_000, 75_000],
        rolls: 4,
        table: [
            ['bouillabaisse', 20, 1, 2],
            ['xp_potion', 16, 1, 2],
            ['lucky_clover', 16, 1, 2],
            ['bank_note', 12, 1, 1],
            ['diamond', 14, 1, 3],
            ['golden_koi', 6, 1, 1],
            ['carpathian_crystal', 6, 1, 1],
            ['stone_head', 5, 1, 1],
            ['meteorite', 0.4, 1, 1],
        ],
    },
};

// Treasure drops that appear in chat. Rarer chests show up less often.
const DROPS = [
    ['common_chest', 70],
    ['rare_chest', 25],
    ['legendary_chest', 5],
];

module.exports = { GATHERING, CHESTS, DROPS };
