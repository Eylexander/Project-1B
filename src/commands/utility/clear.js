const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { GameError } = require('../../core/errors');
const { Card, edit } = require('../../ui/card');
const { loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete recent messages in this channel.')
        .addIntegerOption((o) => o.setName('amount').setDescription('How many (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
        .addUserOption((o) => o.setName('from').setDescription('Only delete messages from this user'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount', true);
        const from = interaction.options.getUser('from');
        if (!interaction.channel?.bulkDelete) throw new GameError("I can't delete messages here.");
        if (!interaction.appPermissions?.has(PermissionFlagsBits.ManageMessages)) throw new GameError('I need the **Manage Messages** permission in this channel.');

        await loading(interaction, 'Cleaning up…', { ephemeral: true });
        let messages = await interaction.channel.messages.fetch({ limit: 100 });
        if (from) messages = messages.filter((m) => m.author.id === from.id);
        // Discord refuses to bulk-delete messages older than 14 days; skip them.
        const deleted = await interaction.channel.bulkDelete([...messages.values()].slice(0, amount), true);
        await interaction.editReply(edit(new Card({ title: 'Cleaned up', emoji: '🧹', color: theme.success })
            .text(`Deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}${from ? ` from ${from}` : ''}.${deleted.size < amount ? '\n-# Messages older than 14 days cannot be bulk-deleted.' : ''}`)));
    },
};
