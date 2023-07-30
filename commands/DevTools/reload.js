const { admin } = require('../../settings.json');

// Create the json script for the help command
module.exports.help = {
    name : "reload",
    description: 'Reloads a command that\'s been modified.',
    aliases : ['r'],
    usage : '[command]',
    parameters: '<command>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the admin
    if (message.author.id !== admin) return;

    // Check if the user provided a command name to reload
    if (args.length <= 1)
    return message.reply({
        content: "Must provide a command name to reload with exact category name.",
        allowedMentions: { repliedUser: false }
    });

    // Construct the command name
    const commandName = args[0].toLowerCase();

    // Check if the command exists and is valid
    if (!client.commands.has(commandName))
    return message.reply("That command does not exist");

    // the path is relative to the *current folder*, so just ./filename.js
    delete require.cache[require.resolve(`../../commands/${args[1]}/${commandName}.js`)];

    // We also need to delete and reload the command from the client.commands Enmap
    client.commands.delete(commandName);
    const props = require(`../../commands/${args[1]}/${commandName}.js`);
    client.commands.set(commandName, props);

    // Send a confirmation message
    return message.reply({
        content: `The command \`${commandName}.js\` has been reloaded!`,
        allowedMentions: { repliedUser: false }
    });
};