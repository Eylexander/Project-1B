const { SlashCommandBuilder } = require('discord.js');

module.exports.help = {
    name : "reload",
    description: 'Reloads a command that\'s been modified.',
    aliases : ['r'],
    usage : '[command]',
    parameters: '<command>'
};

module.exports.execute = async (client, message, args) => {
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
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('command')
            .setDescription('Command to reload')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('category')
            .setDescription('Category of the command')
            .setRequired(true))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;

    const commandName = interaction.options.getString('command');
    // Check if the command exists and is valid
    if (!client.commands.has(commandName)) {
        return interaction.reply({content: "That command does not exist", ephemeral: true});
    }
    // the path is relative to the *current folder*, so just ./filename.js
    delete require.cache[require.resolve(`../../commands/${interaction.options.getString('category')}/${commandName}.js`)];
    // We also need to delete and reload the command from the client.commands Enmap
    client.commands.delete(commandName);
    const props = require(`../../commands/${interaction.options.getString('category')}/${commandName}.js`);
    client.commands.set(commandName, props);
    interaction.reply({content: `The command ${commandName} has been reloaded`, ephemeral: true})
};