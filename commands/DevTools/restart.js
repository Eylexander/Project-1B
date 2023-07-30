const { admin, token } = require('../../settings.json');
const { logToConsole, logToDB } = require('../../tools/Loader.js');

// Create the json script for the help command
module.exports.help = {
    name : "restart",
    description: 'Restart command but does not apply changes.',
    aliases : ['rs','reset'],
    usage : 'none',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the admin
    if (message.author.id !== admin) return;

    // Restart the bot
    try {
        logToConsole('Restarting ...');

        // Delete the original message
        setTimeout(() => {message.delete()}, 1000)

        // Send a message to the channel
        message.channel.send('Restarting...')    
            .then(async message => {
                // First, destroy the client
                await client.destroy()
                // Then, login again
                client.login(token)

                // Edit the message to say that the restart worked
                await message.edit('Restart worked')
                // Delete the message after 2 seconds
                setTimeout(() => {message.delete()}, 2000)
            });

    } catch(error) {
        // If an error occurs, log it
        console.error(error);
        logToDB(error);
    }
};