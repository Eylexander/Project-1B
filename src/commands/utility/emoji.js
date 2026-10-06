const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { GameError } = require('../../core/errors');
const { Card, payload, linkButton } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Show a custom emoji in full size.')
        .addStringOption((o) => o.setName('emoji').setDescription('Paste a custom emoji').setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const input = interaction.options.getString('emoji', true);
        const match = input.match(/<(a?):(\w+):(\d+)>/);
        if (!match) throw new GameError('That is not a custom emoji. Regular emoji are already as big as they get! 😄', { emoji: '🔍' });
        const [, animated, name, id] = match;
        const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=512`;
        await interaction.reply(payload(new Card({ title: `:${name}:`, emoji: '🔍', subtitle: `id ${id}`, color: theme.info })
            .image(url)
            .buttons(linkButton(url, 'Download', '⬇️'))));
    },
};
