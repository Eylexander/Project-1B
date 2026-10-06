const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const market = require('../../game/market');
const { GATHERING, CHESTS } = require('../../data/loot');
const { RECIPES } = require('../../data/recipes');
const { money } = require('../../game/format');
const { Card, payload } = require('../../ui/card');

function sources(itemId) {
    const found = [];
    for (const [activity, def] of Object.entries(GATHERING)) {
        if (def.table.some(([id]) => id === itemId)) found.push(`${def.emoji} /${activity}`);
    }
    for (const [name, chest] of Object.entries(CHESTS)) {
        if (chest.table.some(([id]) => id === itemId)) found.push(`📦 ${name} chests`);
    }
    const recipe = Object.values(RECIPES).find((r) => r.output[0] === itemId);
    if (recipe) found.push('⚒️ /craft');
    if (inventory.item(itemId).buy) found.push('🛒 /shop');
    return found;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Everything about an item: value, rarity, where to find it.')
        .addStringOption((o) => o.setName('name').setDescription('Which item').setRequired(true).setAutocomplete(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        await interaction.respond(inventory.choices(interaction.options.getFocused()));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const item = inventory.requireItem(interaction.options.getString('name', true));
        const rarity = inventory.RARITIES[item.rarity];
        const usedIn = Object.values(RECIPES).filter((r) => r.inputs[item.id]).map((r) => inventory.item(r.output[0]));
        const lowest = market.lowestPrice(item.id);
        const recipe = Object.values(RECIPES).find((r) => r.output[0] === item.id);

        const card = new Card({ title: item.name, emoji: item.emoji, subtitle: `${rarity.emoji} ${rarity.name} · ${inventory.CATEGORIES[item.category].name}`, color: rarity.color })
            .text(`> ${item.description}`)
            .lines([
                '',
                item.buy ? `🛒 **Shop price** ${money(item.buy)}` : null,
                `🏷️ **Sells for** ${item.sell ? money(item.sell) : 'cannot be sold'}`,
                lowest ? `🏪 **Cheapest on the market** ${money(lowest)}` : null,
                item.durability ? `🔧 **Durability** ${item.durability} uses · tier ${item.tier}` : null,
                `🎒 **You own** ${inventory.count(user.id, item.id)}`,
                sources(item.id).length ? `📍 **Found via** ${sources(item.id).join(', ')}` : null,
                recipe ? `⚒️ **Recipe** ${Object.entries(recipe.inputs).map(([id, qty]) => `${inventory.item(id).emoji} ${inventory.item(id).name} ×${qty}`).join(' + ')}` : null,
                usedIn.length ? `🧩 **Used to craft** ${usedIn.map((i) => `${i.emoji} ${i.name}`).join(', ')}` : null,
            ]);
        await interaction.reply(payload(card));
    },
};
