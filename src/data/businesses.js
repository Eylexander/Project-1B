// Idle businesses. Income is per hour at level 1; each level adds +60% of the base.
// Upgrading from level n costs cost * 0.5 * 1.35^(n-1). Unclaimed income caps at STORAGE_HOURS.

const STORAGE_HOURS = 12;
const MAX_LEVEL = 10;

const BUSINESSES = {
    lemonade: { name: 'Lemonade Stand', emoji: '🍋', level: 1, cost: 5_000, income: 120, flavor: 'Every empire starts somewhere.' },
    food_truck: { name: 'Food Truck', emoji: '🚚', level: 4, cost: 40_000, income: 700, flavor: 'Tacos on wheels.' },
    boulangerie: { name: 'Boulangerie', emoji: '🥖', level: 8, cost: 160_000, income: 2_400, flavor: 'Fresh baguettes at 6am, every day.' },
    arcade: { name: 'Retro Arcade', emoji: '🕹️', level: 12, cost: 550_000, income: 7_500, flavor: 'Insert coin to continue.' },
    startup: { name: 'Tech Startup', emoji: '💡', level: 18, cost: 2_000_000, income: 25_000, flavor: 'It is like Uber, but for Discord bots.' },
    hotel: { name: 'Hotel', emoji: '🏨', level: 25, cost: 7_500_000, income: 85_000, flavor: 'Five stars, three of them earned.' },
    swiss_bank: { name: 'Banque Suisse', emoji: '🏦', level: 32, cost: 30_000_000, income: 300_000, flavor: 'Banques Suisses. Discreet. Very discreet.' },
    space_agency: { name: 'Space Agency', emoji: '🚀', level: 40, cost: 150_000_000, income: 1_200_000, flavor: 'The last stop before your first billion.' },
};

for (const [id, business] of Object.entries(BUSINESSES)) business.id = id;

module.exports = { BUSINESSES, STORAGE_HOURS, MAX_LEVEL };
