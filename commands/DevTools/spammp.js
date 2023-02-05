const { admin } = require('../../settings.json')

// Create the json script for the help command
module.exports.help = {
    name : "spammp",
    description: 'Spam a user trough DM',
    aliases : ['mpspam','spamdm'],
    usage : '[user] [amount] [message]',
    parameters: '<user> <amount>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the author is the admin
    if (message.author.id !== admin) return;

    // Delete the original message
    setTimeout(() => {message.delete()}, 500);

    // Check the inputs of the user
    if (args.length < 3)
    return message.reply({
        content: 'You have to tag or Id someone then type the number of message with the text attached!',
        allowedMentions: { repliedUser: false }
    }).then(msg => {
        setTimeout(() => {msg.delete()}, 2500);
    });

    // Loop through the amount of messages
    for (let i = 0; i < args[1]; i++) {
        // Send the message to the user with a delay of 500ms
        setTimeout(() => {
            message.mentions.users.first().send(args.slice(2).join(' '));
        }, 500 * i);
    }
    
};