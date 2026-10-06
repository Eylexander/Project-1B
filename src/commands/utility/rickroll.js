const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const words = require('../../game/words');
const rng = require('../../game/rng');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rickroll')
        .setDescription('Never gonna give you up.')
        .addUserOption((o) => o.setName('user').setDescription('Your victim').setRequired(true))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const target = interaction.options.getUser('user', true);
        const gifs = words.get('rickroll');
        const card = new Card({ color: theme.danger }).text(`**${interaction.user.username}** rickrolled <@${target.id}>! 🕺`);
        if (gifs.length) card.image(rng.pick(gifs));
        await interaction.reply(payload(card, { ping: [target.id] }));
    },
};
