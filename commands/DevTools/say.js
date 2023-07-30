const { PermissionsBitField } = require('discord.js');
const { admin } = require('../../settings.json')

// Create the json script for the help command
module.exports.help = {
    name : "say",
    description: 'Say command',
    aliases : ['tell','shout'],
    usage : '[Information]',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check the inputs
    if (!args[0])
    return message.reply({
        content: 'Please provide a message to send',
        allowedMentions: { repliedUser: false }
    });

    // Check if the user is an admin or has the admin permission
    if (message.author.id == admin || message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        
        // Delete the original message
        setTimeout(() => {message.delete()}, 200);

        // Send the message
        message.channel.send(args.join(' '));
    }
};