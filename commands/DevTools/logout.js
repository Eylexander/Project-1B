const { admin } = require('../../settings.json');
const { logToConsole, logToDB } = require('../../tools/Loader.js');

// Create the json script for the help command
module.exports.help = {
    name : "logout",
    description: 'Disconnect from the console',
    aliases : ['out'],
    usage : 'none',
    parameters : 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    
    // Check if the user is the admin
    if (message.author.id !== admin) return;

    // Disconnect from the console
    try {
        logToConsole('Disconnecting from console ...');
        // Delete the original message
        setTimeout(() => {message.delete()}, 1000);
        // Send a confirmation message
        message.channel.send('Logging out...')
            .then(message => {
                // Delete the confirmation message after 1.5 seconds
                setTimeout(() => { message.delete()}, 1500);
            });
        // Disconnect from the console
        setTimeout(() => { process.exit(1) }, 3000);
        // Destroy the client
        setTimeout(() => { client.destroy() }, 3000);

        // Technically this does not logout of console but it kills the process and destroys the client

    } catch(error) {
        // If an error occurs, log it
        logToConsole(error);
        logToDB(error);
    }
};