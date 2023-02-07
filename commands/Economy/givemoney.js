const { SlashCommandBuilder } = require('discord.js');

// Create the json script for the help command
module.exports.help = {
    name: "givemoney",
    aliases: ['give'],
    description: "Give money/items to a user",
    usage: '[user] [item] [amount]',
    parameters: '[user] [item] [amount]',
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    message.reply("This command is not ready yet !");
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user to give money to')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('item')
            .setDescription('The item to give')
            .setRequired(true))
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('The amount of the item to give')
            .setRequired(true))
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    interaction.reply("This command is not ready yet !");
};