// Crafting recipes: output item <- inputs. `level` gates the recipe.
const RECIPES = {
    iron_bar: { output: ['iron_bar', 1], inputs: { iron_ore: 3, coal: 1 }, level: 1 },
    gold_bar: { output: ['gold_bar', 1], inputs: { gold_ore: 3, coal: 1 }, level: 3 },
    patate_chips: { output: ['patate_chips', 1], inputs: { potato: 5 }, level: 1 },
    sushi_platter: { output: ['sushi_platter', 1], inputs: { shrimp: 3, sardine: 2 }, level: 2 },
    bouillabaisse: { output: ['bouillabaisse', 1], inputs: { crab: 2, squid: 1, tropical_fish: 1 }, level: 6 },
    golden_rod: { output: ['golden_rod', 1], inputs: { fishing_rod: 1, gold_bar: 3 }, level: 8 },
    reinforced_pickaxe: { output: ['reinforced_pickaxe', 1], inputs: { pickaxe: 1, iron_bar: 4 }, level: 6 },
    metal_detector: { output: ['metal_detector', 1], inputs: { shovel: 1, iron_bar: 2, gold_bar: 1 }, level: 7 },
    diamond_ring: { output: ['diamond_ring', 1], inputs: { diamond: 1, gold_bar: 2 }, level: 10 },
    royal_crown: { output: ['royal_crown', 1], inputs: { gold_bar: 3, diamond: 2, carpathian_crystal: 1 }, level: 20 },
};

for (const [id, recipe] of Object.entries(RECIPES)) recipe.id = id;

module.exports = { RECIPES };
