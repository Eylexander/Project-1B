const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const shop = require('../../game/shop');
const users = require('../../game/users');
const { parseAmount } = require('../../game/amount');
const { money, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy items from the shop.')
        .addStringOption((o) => o.setName('item').setDescription('What to buy').setRequired(true).setAutocomplete(true))
        .addStringOption((o) => o.setName('amount').setDescription('How many (e.g. 5, max)'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        await interaction.respond(inventory.choices(interaction.options.getFocused(), (i) => i.buy)
            .map((c) => ({ ...c, name: `${c.name} · ${money(inventory.item(c.value).buy)}` })));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const item = inventory.requireItem(interaction.options.getString('item', true));
        if (!item.buy) throw new GameError(`${itemLabel(item)} isn't sold in the shop. Check \`/market browse\`.`);
        const affordable = Math.min(Math.floor(user.wallet / item.buy), shop.MAX_STACK_BUY);
        const amount = parseAmount(interaction.options.getString('amount') ?? '1', { available: affordable, label: 'quantity' });
        const result = shop.buy(user.id, item.id, amount);
        const after = users.get(user.id);
        await interaction.reply(payload(new Card({ title: 'Purchase complete', emoji: '🛒', color: theme.success })
            .text(`You bought ${itemLabel(item, amount)} for **${money(result.cost)}**.`)
            .footer(`Wallet: ${money(after.wallet)} · you now own ${inventory.count(user.id, item.id)}`)
            .notices(player.welcome(user))));
    },
};
