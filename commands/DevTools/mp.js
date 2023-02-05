const { admin } = require('../../settings.json')

// Create the json script for the help command
module.exports.help = {
    name : "mp",
    description: 'Private Message anyone!',
    aliases : ['privatemessage','pm'],
    usage : '[Tag] [Information]',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    // Check if the author is the admin
    if (!message.author.id === admin) return;

    // Check if the author has tagged someone
    switch (args[0]) {
        case undefined:
        case null:
            // If not, send a message
            message.reply({content: 'You have to tag or Id someone !', allowedMentions: { repliedUser: false }});
            break;
        default:
            // If yes, send a message to the tagged user and verify if there is some text
            if (message.mentions.users.first() && args.length > 1) {
                // Get the user tag object
                const getMentionTag = message.mentions.users.first();

                // Delete the original message
                setTimeout(() => {message.delete()}, 500)

                // Send the message to the tagged user
                getMentionTag.send(args.slice(1).join(' '));

            } else {
                // If not, send a message
                message.reply({content:
                    'You have to tag or Id someone with some text !',
                    allowedMentions: { repliedUser: false }
                });
            }
            break;
    }
};