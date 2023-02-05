const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

// Create the json script for the help command
module.exports.help = {
    name : "clear",
    description : "To clear chat",
    aliases : ['clean', 'delete'],
    usage : '[amount]',
    parameters: '<amount>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user has the permission to execute the command (manage_messages)
    // If not, send a message and delete it after 2.5 seconds
    if (!message.member.permissions.has(PermissionsBitField.Flags.MANAGE_MESSAGES))
    return message.reply({
        content: "You need `manage_messages` permission to execute this command.",
        allowedMentions: { repliedUser: false }
    }).then(message => {
        // Delete the message after 2.5 seconds
        setTimeout(() => {message.delete()}, 2500)
    });

    // Check if the user has entered a valid amount
    if (!Number(args[0]))
    return message.reply({
        content: "You need to enter a valid amount.",
        allowedMentions: { repliedUser: false }
    }).then(message => {
        // Delete the message after 2.5 seconds
        setTimeout(() => {message.delete()}, 2500)
    });

    // Delete the messages and send a message with the amount of deleted messages
    message.channel.bulkDelete(Number(args[0]) + 1)
        .then(() => {
            // Send a message with the amount of deleted messages after executing the command
            message.channel.send(`Cleared ${args[0]} messages.`)
                .then(message => {
                    // Delete the message after 2.5 seconds
                    setTimeout(() => {message.delete()}, 2500);
                });
    });
};

// Create the json script for the slash command
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

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {

    // Delete the messages and send a message with the amount of deleted messages
    interaction.channel.bulkDelete(interaction.options.getInteger('amount') + 1)
        .then(() => {
            // Send a message with the amount of deleted messages after executing the command
            interaction.reply(`Cleared ${interaction.options.getInteger('amount')} messages.`)
        });

    // Delete the interaction after 5 seconds
    setTimeout(() => { interaction.deleteReply() }, 5000);
};