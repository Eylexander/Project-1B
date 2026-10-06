const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setTimeout: sleep } = require('node:timers/promises');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const users = require('../../game/users');
const casino = require('../../game/casino');
const progress = require('../../game/progress');
const { money } = require('../../game/format');
const { Card, payload, edit } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('European roulette. Colours pay 2x, dozens 3x, a single number 36x.')
        .addStringOption((o) => o.setName('on').setDescription('What you bet on').setRequired(true)
            .addChoices(
                ...Object.entries(casino.ROULETTE_BETS).map(([value, b]) => ({ name: `${b.name} (${b.payout}x)`, value })),
                { name: '🎯 A single number (36x)', value: 'number' },
            ))
        .addStringOption((o) => o.setName('bet').setDescription('e.g. 500, 10k, half, all').setRequired(true))
        .addIntegerOption((o) => o.setName('number').setDescription('Your number, if you bet on one').setMinValue(0).setMaxValue(36))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const on = interaction.options.getString('on', true);
        const number = interaction.options.getInteger('number');
        if (on === 'number' && number === null) throw new GameError('Pick your number with the `number` option (0-36).', { emoji: '🎯' });
        const bet = casino.placeBet(user, interaction.options.getString('bet', true), 'roulette');
        const spin = casino.roulette(on, number);
        const payout = bet * spin.multiplier;
        const { events, net } = casino.settle(user.id, bet, payout, 'roulette');
        const notices = progress.after(user.id, { xp: 5, events });
        const label = on === 'number' ? `number **${number}**` : `**${casino.ROULETTE_BETS[on].name}**`;

        await interaction.reply(payload(new Card({ title: 'Roulette', emoji: '🎡', color: theme.casino })
            .text(`**${money(bet)}** on ${label}.\n⚪ *The ball is rolling...*`)));
        await sleep(1_500);
        await interaction.editReply(edit(new Card({ title: spin.win ? 'You won!' : 'You lost', emoji: '🎡', color: spin.win ? theme.success : theme.danger })
            .text(`## ${spin.color} ${spin.pocket}`)
            .text(spin.win ? `${label} wins! You get **${money(payout)}** (+${money(net)}).` : `You lose **${money(bet)}**.`)
            .footer(`Wallet: ${money(users.get(user.id).wallet)}`)
            .notices(notices)));
    },
};
