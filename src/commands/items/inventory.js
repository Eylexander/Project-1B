const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const { money, num } = require('../../game/format');
const { Card } = require('../../ui/card');
const { paginate } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const PER_PAGE = 15;

function line(row) {
    const rarity = inventory.RARITIES[row.item.rarity].emoji;
    const durability = row.item.durability ? ` · ${row.durability ?? row.item.durability}/${row.item.durability} uses` : '';
    return `${rarity} ${row.item.emoji} **${row.item.name}** ×${num(row.quantity)}${durability}${row.item.sell ? ` · ${money(row.item.sell * row.quantity)}` : ''}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Everything in your backpack.')
        .addUserOption((o) => o.setName('user').setDescription("Peek into someone else's backpack"))
        .addStringOption((o) => o.setName('category').setDescription('Only show one category')
            .addChoices(...Object.entries(inventory.CATEGORIES).map(([value, c]) => ({ name: `${c.emoji} ${c.name}`, value }))))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const other = interaction.options.getUser('user');
        const user = other && other.id !== me.id ? player.target(other) : me;
        const category = interaction.options.getString('category');
        const rows = inventory.list(user.id).filter((r) => !category || r.item.category === category);
        const value = rows.reduce((sum, r) => sum + r.item.sell * r.quantity, 0);
        const count = rows.reduce((sum, r) => sum + r.quantity, 0);
        const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));

        await paginate(interaction, (page) => {
            const card = new Card({
                title: `${user.username}'s backpack`,
                emoji: '🎒',
                subtitle: `${num(count)} items · worth ${money(value)}${category ? ` · ${inventory.CATEGORIES[category].name}` : ''}`,
                color: theme.items,
            });
            const slice = rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
            if (!slice.length) {
                card.text(user.id === me.id ? 'Empty! Get started with `/shop`, `/fish`, `/mine` or `/dig`.' : 'Nothing in here.');
                return card;
            }
            let lastCategory = null;
            const lines = [];
            for (const row of slice) {
                if (row.item.category !== lastCategory) {
                    const c = inventory.CATEGORIES[row.item.category];
                    lines.push(`${lines.length ? '\n' : ''}**${c.emoji} ${c.name}**`);
                    lastCategory = row.item.category;
                }
                lines.push(line(row));
            }
            return card.lines(lines).footer('Sell with /sell · use with /use · details with /item');
        }, { pages });
    },
};
