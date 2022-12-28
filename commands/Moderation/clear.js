const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports.help = {
    name : "clear",
    description : "To clear chat",
    aliases : ['clean', 'delete'],
    usage : '[amount]',
    parameters: '<amount>'
};

module.exports.execute = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionsBitField.Flags.MANAGE_MESSAGES))
    return message.reply({
        content: "You need `manage_messages` permission to execute this command.",
        allowedMentions: { repliedUser: false }
    }).then(message => {setTimeout(() => {message.delete()}, 2500)});

    if (!Number(args[0]))
    return message.reply({
        content: "You need to enter a valid amount.",
        allowedMentions: { repliedUser: false }
    }).then(message => {setTimeout(() => {message.delete()}, 2500)});

    message.channel.bulkDelete(Number(args[0]) + 1)
        .then(() => {
            message.channel.send(`Cleared ${args[0]} messages.`)
                .then(message => {
                    setTimeout(() => {message.delete()}, 2500);
                });
    });
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('Amount of messages to clear')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.MANAGE_MESSAGES)
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    interaction.channel.bulkDelete(interaction.options.getInteger('amount') + 1)
    .then(() => {
        interaction.reply(`Cleared ${interaction.options.getInteger('amount')} messages.`)
            .then(interaction => {
                setTimeout(() => {interaction.deleteReply()}, 2500);
            });
    });
};