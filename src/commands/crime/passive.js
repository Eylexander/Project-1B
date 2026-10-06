const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const crime = require('../../game/crime');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('passive')
        .setDescription("Passive mode: nobody can rob you, and you can't rob or join heists.")
        .addStringOption((o) => o.setName('mode').setDescription('On or off').setRequired(true)
            .addChoices({ name: '🕊️ On', value: 'on' }, { name: '⚔️ Off', value: 'off' }))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const enabled = interaction.options.getString('mode', true) === 'on';
        crime.setPassive(user, enabled);
        await interaction.reply(payload(new Card({ title: `Passive mode ${enabled ? 'on' : 'off'}`, emoji: enabled ? '🕊️' : '⚔️', color: enabled ? theme.info : theme.crime })
            .text(enabled ? 'You are safe from robbers. You also cannot rob anyone or join heists.' : 'You are back in the game. Watch your wallet!')
            .footer('You can switch again in 12 hours.')));
    },
};
