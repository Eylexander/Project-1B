const { SlashCommandBuilder, InteractionContextType, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } = require('discord.js');
const { q } = require('../../db');
const config = require('../../config');
const logger = require('../../core/logger');
const users = require('../../game/users');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

function modal() {
    return new ModalBuilder()
        .setCustomId('p1b:suggest')
        .setTitle('Suggest something for Project 1B')
        .addLabelComponents(
            new LabelBuilder()
                .setLabel('Title')
                .setTextInputComponent(new TextInputBuilder().setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true).setPlaceholder('A new job: Fromager')),
            new LabelBuilder()
                .setLabel('Your idea')
                .setDescription('What should change, and why would it be fun?')
                .setTextInputComponent(new TextInputBuilder().setCustomId('body').setStyle(TextInputStyle.Paragraph).setMaxLength(1500).setRequired(true)),
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Send an idea to the bot owner.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        await interaction.showModal(modal());
    },

    components: {
        async suggest(interaction) {
            const title = interaction.fields.getTextInputValue('title');
            const body = interaction.fields.getTextInputValue('body');
            const id = q('INSERT INTO suggestions (user_id, username, title, body, created_at) VALUES (?, ?, ?, ?, ?)')
                .run(interaction.user.id, users.displayName(interaction.user), title, body, Date.now()).lastInsertRowid;
            await interaction.reply(payload(new Card({ title: 'Thanks for the idea!', emoji: '💡', color: theme.success })
                .text(`Suggestion **#${id}** was sent to the owner.\n> **${title}**`), { ephemeral: true }));

            // Let the owner know right away (if their DMs are open).
            if (config.ownerId) {
                try {
                    const owner = await interaction.client.users.fetch(config.ownerId);
                    await owner.send(payload(new Card({ title: `Suggestion #${id}: ${title}`, emoji: '💡', subtitle: `from ${interaction.user.username} (${interaction.user.id})`, color: theme.info }).text(body)));
                } catch (error) {
                    logger.warn(`Could not DM the owner about suggestion #${id}: ${error.message}`);
                }
            }
        },
    },
};
