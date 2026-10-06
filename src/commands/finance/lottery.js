const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const lottery = require('../../game/lottery');
const { money, relative, timestamp, num, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

function infoCard(user) {
    const draw = lottery.current();
    const mine = lottery.ticketsOf(user.id, draw.id);
    const last = lottery.lastResult();
    return new Card({ title: `Lottery draw #${draw.id}`, emoji: '🎟️', color: theme.brand })
        .lines([
            `## ${money(draw.pot)}`,
            `Draw ${timestamp(draw.draws_at)} (${relative(draw.draws_at)})`,
            `🎫 **${num(draw.tickets)}** tickets sold to **${draw.players}** player${draw.players === 1 ? '' : 's'}`,
            `🙋 You hold **${mine}** ticket${mine === 1 ? '' : 's'}${draw.tickets ? ` · ${pct(mine / draw.tickets, { sign: false, digits: 1 })} chance` : ''}`,
        ])
        .divider()
        .lines([
            `Tickets cost **${money(lottery.TICKET_PRICE)}** · max ${lottery.MAX_TICKETS} per draw · 90% of sales go into the pot`,
            last ? `Last draw: ${last.winner_id ? `**${last.winner_name}** won **${money(last.pot)}**` : 'no players, the seed rolled over'}` : null,
        ]);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lottery')
        .setDescription('A daily jackpot for the whole bot. One ticket could change everything.')
        .addSubcommand((s) => s.setName('info').setDescription('Current jackpot and your tickets.'))
        .addSubcommand((s) => s.setName('buy').setDescription('Buy tickets.')
            .addIntegerOption((o) => o.setName('tickets').setDescription('How many').setRequired(true).setMinValue(1).setMaxValue(lottery.MAX_TICKETS)))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        if (interaction.options.getSubcommand() === 'info') return interaction.reply(payload(infoCard(user).notices(player.welcome(user))));
        const count = interaction.options.getInteger('tickets', true);
        const result = lottery.buy(user.id, count);
        await interaction.reply(payload(new Card({ title: 'Tickets bought', emoji: '🎫', color: theme.success })
            .text(`You bought **${count}** ticket${count === 1 ? '' : 's'} for ${money(result.cost)}. You now hold **${result.owned}**.`)
            .text(`The jackpot is now **${money(result.draw.pot)}**. Draw ${relative(result.draw.draws_at)}.`)));
    },
};
