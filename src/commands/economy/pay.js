const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { tx } = require('../../db');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const economy = require('../../game/economy');
const progress = require('../../game/progress');
const { parseAmount } = require('../../game/amount');
const { money } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const { confirm, finish } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const TAX = 0.03;
const CONFIRM_ABOVE = 100_000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Send money to another player (3% transfer tax).')
        .addUserOption((o) => o.setName('user').setDescription('Who gets the money').setRequired(true))
        .addStringOption((o) => o.setName('amount').setDescription('e.g. 5000, 10k, half, all').setRequired(true))
        .addStringOption((o) => o.setName('note').setDescription('A message for them').setMaxLength(100))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const sender = player.self(interaction);
        const recipientUser = interaction.options.getUser('user', true);
        if (recipientUser.id === sender.id) throw new GameError('Paying yourself? Bold strategy, but no.');
        const recipient = player.target(recipientUser, { create: true });
        const amount = parseAmount(interaction.options.getString('amount', true), { available: sender.wallet });
        if (amount > sender.wallet) throw new GameError(`You only have **${money(sender.wallet)}** in your wallet.`, { title: 'Not enough money', emoji: '💸' });
        const tax = Math.floor(amount * TAX);
        const note = interaction.options.getString('note');

        const send = () => {
            tx(() => {
                economy.debit(sender.id, amount, 'pay_out', `To ${recipient.username}${note ? `: ${note}` : ''}`);
                economy.credit(recipient.id, amount - tax, 'pay_in', `From ${sender.username}${note ? `: ${note}` : ''}`);
            });
            economy.toTreasury(tax);
            const notices = progress.after(sender.id, { events: { pay_sent: amount } });
            return new Card({ title: 'Payment sent', emoji: '🤝', color: theme.success })
                .lines([
                    `<@${sender.id}> sent **${money(amount - tax)}** to <@${recipient.id}>.`,
                    note ? `> ${note}` : null,
                ])
                .footer(`Transfer tax: ${money(tax)}`)
                .notices(notices);
        };

        if (amount < CONFIRM_ABOVE) return interaction.reply(payload(send(), { ping: [recipient.id] }));
        const answer = await confirm(interaction, new Card({ title: 'Confirm payment', emoji: '💸', color: theme.warning })
            .text(`Send **${money(amount)}** to **${recipient.username}**? They will receive **${money(amount - tax)}** after tax.`));
        if (answer.ok) await finish(answer.click, send);
    },
};
