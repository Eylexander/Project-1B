module.exports = {
    help: {
        name : "reload",
        description: 'Reloads a command that\'s been modified.',
        aliases : ['r'],
        usage : '[command]',
        parameters: '<command>'
    },
    execute: async (client, message, args) => {
        if (!args || args.length < 1) return message.reply({content: "Must provide a command name to reload.", allowedMentions: { repliedUser: false }});
        const commandName = args[0];
        // Check if the command exists and is valid
        if (!client.commands.has(commandName)) {
          return message.reply("That command does not exist");
        }
        // the path is relative to the *current folder*, so just ./filename.js
        delete require.cache[require.resolve(`../../commands/${args[1]}/${commandName}.js`)];
        // We also need to delete and reload the command from the client.commands Enmap
        client.commands.delete(commandName);
        const props = require(`../../commands/${args[1]}/${commandName}.js`);
        client.commands.set(commandName, props);
        message.reply(`The command ${commandName} has been reloaded`);
    },
}