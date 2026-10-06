const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { setTimeout: sleep } = require('node:timers/promises');
const player = require('../../core/player');
const users = require('../../game/users');
const casino = require('../../game/casino');
const progress = require('../../game/progress');
const { money } = require('../../game/format');
const { Card, payload, edit } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription(`Heads or tails? Win ${casino.COINFLIP_PAYOUT}x your bet.`)
        .addStringOption((o) => o.setName('side').setDescription('Your call').setRequired(true)
            .addChoices({ name: '🙂 Heads', value: 'heads' }, { name: '🪙 Tails', value: 'tails' }))
        .addStringOption((o) => o.setName('bet').setDescription('e.g. 500, 10k, half, all').setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const side = interaction.options.getString('side', true);
        const bet = casino.placeBet(user, interaction.options.getString('bet', true), 'coinflip');
        const flip = casino.coinflip(side);
        const payout = Math.floor(bet * flip.multiplier);
        const { events, net } = casino.settle(user.id, bet, payout, 'coinflip');
        const notices = progress.after(user.id, { xp: 5, events });

        await interaction.reply(payload(new Card({ title: 'Coinflip', emoji: '🪙', color: theme.casino })
            .text(`You bet **${money(bet)}** on **${side}**...\n🪙 *The coin spins through the air...*`)));
        await sleep(1_200);
        await interaction.editReply(edit(new Card({ title: flip.win ? 'You won!' : 'You lost', emoji: flip.result === 'heads' ? '🙂' : '🪙', color: flip.win ? theme.success : theme.danger })
            .text(`It landed on **${flip.result}**. ${flip.win ? `You win **${money(payout)}** (+${money(net)})!` : `You lose **${money(bet)}**.`}`)
            .footer(`Wallet: ${money(users.get(user.id).wallet)}`)
            .notices(notices)));
    },
};
