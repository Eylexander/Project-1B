const { admin } = require('../../settings.json');
const chalk = require('chalk');
const { logToConsole, logToDB } = require('../../tools/Loader.js');

// Create the json script for the help command
module.exports.help = {
    name: "stop",
    description: 'Stop command',
    aliases : ['end','ends','off','kill'],
    usage : 'none',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the admin
    if (message.author.id !== admin) return;

    // Stop the bot
    try {
        logToConsole(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
        
        // Delete the original message
        setTimeout(() => {message.delete()}, 1000)

        // Send a message to the channel
        message.channel.send('Turning off...')
            .then(message => {
                // Delete the message after 1.5 seconds
                setTimeout(() => { message.delete()}, 1500)
            })
        
        // Destroy the client after 3 seconds
        setTimeout(() => { client.destroy() }, 3000);

    } catch (error) {
        // If an error occurs, log it
        console.error(error);
        logToDB(error);
    }
};