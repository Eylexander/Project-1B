const { SlashCommandBuilder, InteractionContextType, ButtonStyle, MessageFlags } = require('discord.js');
const { setTimeout: sleep } = require('node:timers/promises');
const player = require('../../core/player');
const users = require('../../game/users');
const casino = require('../../game/casino');
const progress = require('../../game/progress');
const { money } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const theme = require('../../ui/theme');

const PAYTABLE = Object.entries(casino.THREE).map(([symbol, x]) => `${symbol}${symbol}${symbol} ${x}x`).join(' · ');

function reelsLine(reels) {
    return `## ┃ ${reels.join(' ┃ ')} ┃`;
}

async function spin(interaction, betInput, fromButton) {
    const user = player.self(interaction);
    const bet = casino.placeBet(user, betInput, 'slots');
    const result = casino.slots();
    const payout = Math.floor(bet * result.multiplier);
    const { events, net } = casino.settle(user.id, bet, payout, 'slots');
    const notices = progress.after(user.id, { xp: 5, events });

    const spinning = new Card({ title: 'Slots', emoji: '🎰', color: theme.casino }).text(`${reelsLine(['❔', '❔', '❔'])}\nBet: **${money(bet)}**`);
    if (fromButton) await interaction.update(edit(spinning));
    else await interaction.reply(payload(spinning));
    await sleep(1_000);

    const jackpot = result.multiplier >= 50;
    const card = new Card({ title: jackpot ? 'JACKPOT!' : result.multiplier ? 'Winner!' : 'No luck', emoji: '🎰', color: result.multiplier ? theme.success : theme.danger })
        .text(reelsLine(result.reels))
        .text(result.multiplier ? `**${result.multiplier}x**! You win **${money(payout)}** (${net >= 0 ? '+' : ''}${money(net)}).` : `You lose **${money(bet)}**.`)
        .footer(`Wallet: ${money(users.get(user.id).wallet)} · ${PAYTABLE} · any pair 1.25x (🍒 1.4x)`)
        .notices(notices)
        .buttons(button(`p1b:slots:${user.id}:${bet}`, `Spin again (${money(bet)})`, { style: ButtonStyle.Primary, emoji: '🔁' }));
    await interaction.editReply(edit(card));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Pull the lever. Three 7️⃣ pays 777x.')
        .addStringOption((o) => o.setName('bet').setDescription('e.g. 500, 10k, half, all').setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        await spin(interaction, interaction.options.getString('bet', true), false);
    },

    components: {
        async slots(interaction, [ownerId, bet]) {
            if (interaction.user.id !== ownerId) return interaction.reply({ content: 'Get your own machine! Use `/slots`.', flags: MessageFlags.Ephemeral });
            await spin(interaction, bet, true);
        },
    },
};
