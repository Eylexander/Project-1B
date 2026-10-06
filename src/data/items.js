// Every item in the game. `buy` = shop price (null if not sold), `sell` = what the bot pays you.
// Tools have { tool: activity, tier, durability }. Usable items have a `use` effect handled in game/items.js.

const RARITIES = {
    junk: { name: 'Junk', emoji: '🟤', color: 0x8d6e63, order: 0 },
    common: { name: 'Common', emoji: '⚪', color: 0xb0bec5, order: 1 },
    uncommon: { name: 'Uncommon', emoji: '🟢', color: 0x43a047, order: 2 },
    rare: { name: 'Rare', emoji: '🔵', color: 0x1e88e5, order: 3 },
    epic: { name: 'Epic', emoji: '🟣', color: 0x8e24aa, order: 4 },
    legendary: { name: 'Legendary', emoji: '🟠', color: 0xfb8c00, order: 5 },
    mythic: { name: 'Mythic', emoji: '🔴', color: 0xe53935, order: 6 },
};

const CATEGORIES = {
    tool: { name: 'Tools', emoji: '🧰' },
    consumable: { name: 'Consumables', emoji: '🧃' },
    chest: { name: 'Chests', emoji: '📦' },
    fish: { name: 'Fish', emoji: '🐟' },
    ore: { name: 'Ores & Gems', emoji: '⛏️' },
    relic: { name: 'Relics', emoji: '🏺' },
    crafted: { name: 'Crafted', emoji: '⚒️' },
    collectible: { name: 'Collectibles', emoji: '🏆' },
};

const ITEMS = {
    // Tools
    fishing_rod: { name: 'Fishing Rod', emoji: '🎣', category: 'tool', rarity: 'common', buy: 400, sell: 120, tool: 'fish', tier: 1, durability: 40, description: 'Needed for /fish. Wears out after 40 casts.' },
    pickaxe: { name: 'Pickaxe', emoji: '⛏️', category: 'tool', rarity: 'common', buy: 750, sell: 220, tool: 'mine', tier: 1, durability: 40, description: 'Needed for /mine. Wears out after 40 swings.' },
    shovel: { name: 'Shovel', emoji: '🪏', category: 'tool', rarity: 'common', buy: 500, sell: 150, tool: 'dig', tier: 1, durability: 40, description: 'Needed for /dig. Wears out after 40 holes.' },
    golden_rod: { name: 'Golden Rod', emoji: '🔱', category: 'tool', rarity: 'epic', buy: null, sell: 2_000, tool: 'fish', tier: 2, durability: 100, description: 'Crafted rod: better catches, lasts 100 casts.' },
    reinforced_pickaxe: { name: 'Reinforced Pickaxe', emoji: '⚒️', category: 'tool', rarity: 'epic', buy: null, sell: 1_800, tool: 'mine', tier: 2, durability: 100, description: 'Crafted pickaxe: better ores, lasts 100 swings.' },
    metal_detector: { name: 'Metal Detector', emoji: '📡', category: 'tool', rarity: 'epic', buy: null, sell: 1_900, tool: 'dig', tier: 2, durability: 100, description: 'Crafted detector: better relics, lasts 100 holes.' },
    laptop: { name: 'Laptop', emoji: '💻', category: 'tool', rarity: 'rare', buy: 15_000, sell: 5_000, description: 'Required to work as a Hacker.' },

    // Consumables
    coffee: { name: 'Coffee', emoji: '☕', category: 'consumable', rarity: 'common', buy: 150, sell: 40, use: { energy: 15 }, description: 'Restores 15 energy.' },
    energy_drink: { name: 'Energy Drink', emoji: '🥤', category: 'consumable', rarity: 'uncommon', buy: 600, sell: 150, use: { energy: 40 }, description: 'Restores 40 energy.' },
    patate_chips: { name: 'Patate Chips', emoji: '🍟', category: 'consumable', rarity: 'common', buy: null, sell: 60, use: { energy: 25 }, description: 'Crafted from potatoes. Restores 25 energy. Patate!' },
    sushi_platter: { name: 'Sushi Platter', emoji: '🍱', category: 'consumable', rarity: 'uncommon', buy: null, sell: 180, use: { energy: 70 }, description: 'Crafted. Restores 70 energy.' },
    bouillabaisse: { name: 'Bouillabaisse', emoji: '🍲', category: 'consumable', rarity: 'rare', buy: null, sell: 450, use: { energy: 120 }, description: 'Crafted Marseille classic. Restores 120 energy.' },
    lucky_clover: { name: 'Lucky Clover', emoji: '🍀', category: 'consumable', rarity: 'rare', buy: 6_000, sell: 1_500, use: { boost: 'luck', minutes: 60 }, description: 'Rare finds are 50% more likely for 1 hour (fishing, mining, digging, robbing).' },
    xp_potion: { name: 'XP Potion', emoji: '🧪', category: 'consumable', rarity: 'rare', buy: 8_000, sell: 2_000, use: { boost: 'xp', minutes: 30 }, description: 'Double XP for 30 minutes.' },
    padlock: { name: 'Padlock', emoji: '🔒', category: 'consumable', rarity: 'uncommon', buy: 2_500, sell: 600, description: 'Stops one robbery attempt against you. Used up automatically.' },
    lockpick: { name: 'Lockpick', emoji: '🧷', category: 'consumable', rarity: 'uncommon', buy: 1_500, sell: 400, description: '+15% robbery success and it can break a padlock. Used up on your next /rob.' },
    bank_note: { name: 'Bank Note', emoji: '📜', category: 'consumable', rarity: 'rare', buy: 12_000, sell: 3_000, use: { bank: true }, description: 'Permanently raises your bank capacity.' },
    treasure_map: { name: 'Treasure Map', emoji: '🗺️', category: 'consumable', rarity: 'rare', buy: null, sell: 900, use: { map: true }, description: 'Follow it to a buried chest.' },

    // Chests
    common_chest: { name: 'Wooden Chest', emoji: '📦', category: 'chest', rarity: 'uncommon', buy: 1_200, sell: 300, use: { chest: 'common' }, description: 'Open it for coins and a few items.' },
    rare_chest: { name: 'Iron Chest', emoji: '🧰', category: 'chest', rarity: 'rare', buy: null, sell: 2_500, use: { chest: 'rare' }, description: 'Open it for a good haul.' },
    legendary_chest: { name: 'Royal Chest', emoji: '👑', category: 'chest', rarity: 'legendary', buy: null, sell: 20_000, use: { chest: 'legendary' }, description: 'Fit for a king. Who knows what is inside?' },

    // Fish
    old_boot: { name: 'Old Boot', emoji: '👢', category: 'fish', rarity: 'junk', buy: null, sell: 3, description: 'Somebody lost this. Probably for a reason.' },
    sardine: { name: 'Sardine', emoji: '🐟', category: 'fish', rarity: 'common', buy: null, sell: 14, description: 'Small, silver, plentiful.' },
    shrimp: { name: 'Shrimp', emoji: '🦐', category: 'fish', rarity: 'common', buy: null, sell: 20, description: 'Great in a sushi platter.' },
    tropical_fish: { name: 'Tropical Fish', emoji: '🐠', category: 'fish', rarity: 'uncommon', buy: null, sell: 48, description: 'Colourful and a little smug.' },
    crab: { name: 'Crab', emoji: '🦀', category: 'fish', rarity: 'uncommon', buy: null, sell: 65, description: 'Walks sideways out of your bucket.' },
    pufferfish: { name: 'Pufferfish', emoji: '🐡', category: 'fish', rarity: 'rare', buy: null, sell: 160, description: 'Do not squeeze.' },
    squid: { name: 'Squid', emoji: '🦑', category: 'fish', rarity: 'rare', buy: null, sell: 230, description: 'Inky.' },
    octopus: { name: 'Octopus', emoji: '🐙', category: 'fish', rarity: 'epic', buy: null, sell: 650, description: 'Eight arms, zero patience.' },
    shark: { name: 'Shark', emoji: '🦈', category: 'fish', rarity: 'epic', buy: null, sell: 1_300, description: 'You are going to need a bigger boat.' },
    golden_koi: { name: 'Golden Koi', emoji: '🎏', category: 'fish', rarity: 'legendary', buy: null, sell: 6_000, description: 'Said to bring fortune to whoever releases it. You sell it instead.' },
    leviathan_scale: { name: 'Leviathan Scale', emoji: '🐉', category: 'fish', rarity: 'mythic', buy: null, sell: 50_000, description: 'Proof the sea monster stories were true.' },

    // Ores & gems
    stone: { name: 'Stone', emoji: '🪨', category: 'ore', rarity: 'junk', buy: null, sell: 4, description: 'It is a rock.' },
    coal: { name: 'Coal', emoji: '⬛', category: 'ore', rarity: 'common', buy: null, sell: 16, description: 'Fuel for smelting.' },
    iron_ore: { name: 'Iron Ore', emoji: '🔩', category: 'ore', rarity: 'common', buy: null, sell: 40, description: 'Smelt three into an Iron Bar.' },
    gold_ore: { name: 'Gold Ore', emoji: '🟡', category: 'ore', rarity: 'uncommon', buy: null, sell: 150, description: 'Smelt three into a Gold Bar.' },
    amethyst: { name: 'Amethyst', emoji: '🔮', category: 'ore', rarity: 'rare', buy: null, sell: 320, description: 'Purple and pretty.' },
    diamond: { name: 'Diamond', emoji: '💎', category: 'ore', rarity: 'epic', buy: null, sell: 1_600, description: 'Forever, apparently.' },
    carpathian_crystal: { name: 'Carpathian Crystal', emoji: '🔷', category: 'ore', rarity: 'legendary', buy: null, sell: 9_000, description: 'Only found deep under Les Carpates.' },
    meteorite: { name: 'Meteorite', emoji: '☄️', category: 'ore', rarity: 'mythic', buy: null, sell: 60_000, description: 'It came from space and you hit it with a pickaxe.' },

    // Relics (digging)
    worm: { name: 'Worm', emoji: '🪱', category: 'relic', rarity: 'junk', buy: null, sell: 3, description: 'Wiggly.' },
    potato: { name: 'Potato', emoji: '🥔', category: 'relic', rarity: 'common', buy: null, sell: 12, description: 'Patate. Craft five into chips.' },
    bone: { name: 'Bone', emoji: '🦴', category: 'relic', rarity: 'common', buy: null, sell: 22, description: 'Hopefully from an animal.' },
    ancient_coin: { name: 'Ancient Coin', emoji: '🪙', category: 'relic', rarity: 'uncommon', buy: null, sell: 130, description: 'Older than the economy itself.' },
    fossil: { name: 'Fossil', emoji: '🦖', category: 'relic', rarity: 'rare', buy: null, sell: 420, description: 'Rawr (extinct).' },
    amphora: { name: 'Amphora', emoji: '🏺', category: 'relic', rarity: 'epic', buy: null, sell: 1_900, description: 'Still smells faintly of olive oil.' },
    stone_head: { name: 'Stone Head', emoji: '🗿', category: 'relic', rarity: 'legendary', buy: null, sell: 10_000, description: 'It is watching you sell it.' },
    lost_vinyl: { name: "Rick's Lost Vinyl", emoji: '📀', category: 'relic', rarity: 'mythic', buy: null, sell: 45_000, description: 'Never gonna give it up. Unless the price is right.' },

    // Crafted goods
    iron_bar: { name: 'Iron Bar', emoji: '⛓️', category: 'crafted', rarity: 'uncommon', buy: null, sell: 190, description: 'Smelted iron. Used in tools.' },
    gold_bar: { name: 'Gold Bar', emoji: '🥇', category: 'crafted', rarity: 'rare', buy: null, sell: 620, description: 'Smelted gold. Used in tools and jewellery.' },
    diamond_ring: { name: 'Diamond Ring', emoji: '💍', category: 'crafted', rarity: 'epic', buy: null, sell: 3_600, description: 'Sells for more than its parts.' },
    royal_crown: { name: 'Royal Crown', emoji: '🫅', category: 'crafted', rarity: 'legendary', buy: null, sell: 19_000, description: 'The finest thing you can make with your hands.' },

    // Collectibles
    trophy_1b: { name: '1B Trophy', emoji: '🏆', category: 'collectible', rarity: 'mythic', buy: null, sell: 0, description: 'Awarded for completing Project 1B. Survives every prestige.' },
};

for (const [id, item] of Object.entries(ITEMS)) item.id = id;

module.exports = { ITEMS, RARITIES, CATEGORIES };
