const { SlashCommandBuilder, InteractionContextType, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const player = require('../../core/player');
const users = require('../../game/users');
const inventory = require('../../game/inventory');
const shop = require('../../game/shop');
const { money } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const theme = require('../../ui/theme');

const SHOP_CATEGORIES = ['tool', 'consumable', 'chest'];

function shopCard(userId, category, banner = null) {
    const user = users.get(userId);
    const cat = inventory.CATEGORIES[category];
    const card = new Card({ title: 'Le Shop', emoji: '🛒', subtitle: `${cat.emoji} ${cat.name} · your wallet: ${money(user.wallet)}`, color: theme.items });
    if (banner) card.text(banner).divider();
    for (const item of shop.shopItems().filter((i) => i.category === category)) {
        const owned = inventory.count(userId, item.id);
        card.section(
            `${item.emoji} **${item.name}** · **${money(item.buy)}**${owned ? ` · you own ${owned}` : ''}\n-# ${item.description}`,
            button(`p1b:buy:${item.id}`, 'Buy', { style: user.wallet >= item.buy ? ButtonStyle.Success : ButtonStyle.Secondary, disabled: user.wallet < item.buy }),
        );
    }
    card.select(new StringSelectMenuBuilder()
        .setCustomId('p1b:shopcat')
        .setPlaceholder('Browse another aisle')
        .addOptions(SHOP_CATEGORIES.map((value) => ({
            label: inventory.CATEGORIES[value].name,
            emoji: inventory.CATEGORIES[value].emoji,
            value,
            default: value === category,
        }))));
    card.footer('Buy in bulk with /buy · sell loot with /sell');
    return card;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse the shop: tools, consumables and chests.')
        .addStringOption((o) => o.setName('aisle').setDescription('Which aisle')
            .addChoices(...SHOP_CATEGORIES.map((value) => ({ name: `${inventory.CATEGORIES[value].emoji} ${inventory.CATEGORIES[value].name}`, value }))))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const banner = player.welcome(user)[0] ?? null;
        await interaction.reply(payload(shopCard(user.id, interaction.options.getString('aisle') ?? 'tool', banner), { ephemeral: true }));
    },

    components: {
        async shopcat(interaction) {
            player.self(interaction);
            await interaction.update(edit(shopCard(interaction.user.id, interaction.values[0])));
        },
        async buy(interaction, [itemId]) {
            const user = player.self(interaction);
            const item = inventory.item(itemId);
            const result = shop.buy(user.id, item.id, 1);
            await interaction.update(edit(shopCard(user.id, item.category, `✅ Bought ${item.emoji} **${item.name}** for ${money(result.cost)}.`)));
        },
    },
};
