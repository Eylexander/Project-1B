const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const mentions = require('../../core/mentions');
const networth = require('../../game/networth');
const F = require('../../game/formulas');
const { money } = require('../../game/format');
const { Card, payload } = require('../../ui/card');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Quick look at a wallet and bank.')
        .addUserOption((o) => o.setName('user').setDescription('Check someone else'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const other = interaction.options.getUser('user');
        const user = other && other.id !== me.id ? player.target(other) : me;
        const worth = networth.breakdown(user.id);
        const card = new Card({ title: `${user.username}'s balance`, emoji: '💰' })
            .lines([
                `💵 **Wallet** ${money(user.wallet)}`,
                `🏦 **Bank** ${money(user.bank)} / ${money(F.bankCapacity(user))}`,
                `📊 **Net worth** ${money(worth.total)}`,
            ])
            .footer(user.id === me.id ? `Robbers can only touch your wallet. Deposit with ${mentions.cmd('bank', 'deposit')}.` : null)
            .notices(player.welcome(me));
        await interaction.reply(payload(card));
    },
};
