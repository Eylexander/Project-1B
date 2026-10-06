const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const shop = require('../../game/shop');
const progress = require('../../game/progress');
const { money, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('use')
        .setDescription('Use a consumable or open a chest.')
        .addStringOption((o) => o.setName('item').setDescription('What to use').setRequired(true).setAutocomplete(true))
        .addIntegerOption((o) => o.setName('amount').setDescription('How many to use in a row (chests and food)').setMinValue(1).setMaxValue(25))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const owned = new Map(inventory.list(interaction.user.id).map((r) => [r.item_id, r.quantity]));
        await interaction.respond(inventory.choices(interaction.options.getFocused(), (i) => i.use && owned.has(i.id))
            .map((c) => ({ ...c, name: `${c.name} ×${owned.get(c.value)}` })));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const item = inventory.requireItem(interaction.options.getString('item', true));
        const times = Math.min(interaction.options.getInteger('amount') ?? 1, Math.max(1, inventory.count(user.id, item.id)));

        if (item.use?.chest) {
            let coins = 0;
            const found = new Map();
            const events = {};
            for (let i = 0; i < times; i++) {
                const { opened } = shop.use(user.id, item.id);
                coins += opened.coins;
                for (const f of opened.finds) found.set(f.item.id, (found.get(f.item.id) ?? 0) + f.quantity);
                for (const [k, v] of Object.entries(opened.events)) events[k] = (events[k] ?? 0) + v;
            }
            const notices = progress.after(user.id, { xp: 30 * times, events });
            const lines = [...found].map(([id, qty]) => {
                const loot = inventory.item(id);
                return `${inventory.RARITIES[loot.rarity].emoji} ${itemLabel(loot, qty)}`;
            });
            return interaction.reply(payload(new Card({ title: `${item.name}${times > 1 ? ` ×${times}` : ''} opened!`, emoji: item.emoji, color: inventory.RARITIES[item.rarity].color })
                .text(`💰 **${money(coins)}**`)
                .lines(lines)
                .notices(notices)));
        }

        const messages = [];
        for (let i = 0; i < times; i++) messages.push(shop.use(user.id, item.id).text);
        const unique = [...new Set(messages)];
        await interaction.reply(payload(new Card({ title: `Used ${item.name}${times > 1 ? ` ×${times}` : ''}`, emoji: item.emoji, color: theme.items })
            .lines(unique.length === 1 || times === 1 ? [messages[messages.length - 1]] : messages)));
    },
};
