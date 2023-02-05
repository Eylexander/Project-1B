const { admin } = require('../../settings.json');

// Create the json script for the help command
module.exports.help = {
    name : "spam",
    description: 'Spam command',
    aliases : ['annoy','repeat'],
    usage : '[number] [Information]',
    parameters: '<Number>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the author is the admin
    if (message.author.id !== admin) return;

    // Delete the original message
    setTimeout(() => {message.delete()}, 500)

    // Check if there is a number
    if (args.length < 2)
    return message.reply({
        content: "You have to enter a number and a message to spam !",
        allowedMentions: { repliedUser: false }
    }).then(msg => {
        setTimeout(() => {msg.delete()}, 2500)
    });

    // Spam the message
    for (let i = 0; i < args[0]; i++) {
        // Send the message after 250ms
        setTimeout(() => {message.channel.send(args.slice(1).join(' '))}, 250 * i)
    }
};