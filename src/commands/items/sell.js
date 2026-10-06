const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const shop = require('../../game/shop');
const progress = require('../../game/progress');
const { parseAmount } = require('../../game/amount');
const { money, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell items to the shop. Try "All loot" to empty your bag of fish, ores and relics.')
        .addStringOption((o) => o.setName('item').setDescription('What to sell').setRequired(true).setAutocomplete(true))
        .addStringOption((o) => o.setName('amount').setDescription('How many (e.g. 5, half, all). Default: 1'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const groups = Object.entries(shop.SELL_GROUPS)
            .filter(([, g]) => !focused || g.name.toLowerCase().includes(focused))
            .map(([value, g]) => ({ name: `📦 ${g.name}`, value }));
        const owned = new Map(inventory.list(interaction.user.id).map((r) => [r.item_id, r.quantity]));
        const items = inventory.choices(focused, (i) => owned.has(i.id) && i.sell > 0)
            .map((c) => ({ ...c, name: `${c.name} ×${owned.get(c.value)} · ${money(inventory.item(c.value).sell)} each` }));
        await interaction.respond([...groups, ...items].slice(0, 25));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const query = interaction.options.getString('item', true);
        let sold;
        if (shop.SELL_GROUPS[query]) {
            sold = shop.sellGroup(user.id, query);
        } else {
            const item = inventory.requireItem(query);
            const have = inventory.count(user.id, item.id);
            const amount = parseAmount(interaction.options.getString('amount') ?? '1', { available: have, label: 'quantity' });
            sold = shop.sell(user.id, item.id, amount);
        }
        const notices = progress.after(user.id, { events: { sell_value: sold.total } });
        await interaction.reply(payload(new Card({ title: 'Sold!', emoji: '🏷️', color: theme.success })
            .lines(sold.lines.slice(0, 20).map((l) => `${itemLabel(l.item, l.quantity)} · ${money(l.income)}`))
            .text(sold.lines.length > 20 ? `…and ${sold.lines.length - 20} more` : null)
            .text(`**You earned ${money(sold.total)}**`)
            .notices(notices)));
    },
};
