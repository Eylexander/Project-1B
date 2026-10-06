const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { Card, payload, edit } = require('../../ui/card');
const { send } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Pong! Check the bot latency.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const message = await send(interaction, payload(new Card({ title: 'Pinging...', emoji: '🏓', color: theme.muted })));
        const roundTrip = message.createdTimestamp - interaction.createdTimestamp;
        await interaction.editReply(edit(new Card({ title: 'Pong!', emoji: '🏓', color: theme.success })
            .text(`Round trip **${roundTrip}ms** · WebSocket **${Math.round(interaction.client.ws.ping)}ms**`)));
    },
};
