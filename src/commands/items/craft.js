const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const shop = require('../../game/shop');
const progress = require('../../game/progress');
const { money, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

function ingredients(userId, recipe) {
    return Object.entries(recipe.inputs).map(([id, qty]) => {
        const have = inventory.count(userId, id);
        return `${have >= qty ? '✅' : '❌'} ${itemLabel(inventory.item(id), qty)} *(have ${have})*`;
    }).join(' · ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('craft')
        .setDescription('Turn raw materials into better tools, food and treasures.')
        .addStringOption((o) => o.setName('recipe').setDescription('What to craft (leave empty to see all recipes)').setAutocomplete(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('How many').setMinValue(1).setMaxValue(100))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        await interaction.respond(Object.values(shop.RECIPES)
            .map((r) => ({ recipe: r, item: inventory.item(r.output[0]) }))
            .filter(({ item }) => !focused || item.name.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(({ recipe, item }) => {
                const can = shop.craftable(interaction.user.id, recipe);
                return { name: `${item.emoji} ${item.name}${can ? ` · can craft ${can}` : ''}`, value: recipe.id };
            }));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const query = interaction.options.getString('recipe');

        if (!query) {
            const card = new Card({ title: 'Workshop', emoji: '⚒️', subtitle: 'Recipes and what you are missing', color: theme.items });
            for (const recipe of Object.values(shop.RECIPES)) {
                const item = inventory.item(recipe.output[0]);
                const locked = user.level < recipe.level;
                card.text(`${locked ? '🔒' : shop.craftable(user.id, recipe) ? '🟢' : '⚪'} **${item.emoji} ${item.name}** · sells for ${money(item.sell)}${locked ? ` · level ${recipe.level}` : ''}\n-# ${ingredients(user.id, recipe)}`);
            }
            return interaction.reply(payload(card.footer('Craft with /craft recipe:<name>')));
        }

        const recipe = shop.recipeFor(query);
        if (!recipe) throw new GameError(`There is no recipe for \`${query}\`. Run \`/craft\` to see them all.`);
        const times = interaction.options.getInteger('amount') ?? 1;
        const made = shop.craft(user.id, recipe, times, user.level);
        const notices = progress.after(user.id, { xp: 15 * times, events: { craft: times } });
        await interaction.reply(payload(new Card({ title: 'Crafted!', emoji: '⚒️', color: theme.success })
            .text(`You made ${itemLabel(made.item, made.quantity)}.`)
            .text(`-# ${made.item.description}`)
            .notices(notices)));
    },
};
