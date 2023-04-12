const { SlashCommandBuilder } = require('discord.js');
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');
const tre = new db('./database/economy/treasure.sqlite');

// Create the json script for the help command
module.exports.help = {
    name : "treasure",
    description: 'Open a treasure chest!',
    aliases : ['chest','treasurechest','tr'],
    usage : 'none',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user has a profile
    const profile = inv.prepare("SELECT * FROM profiles WHERE user = ?;").get(message.author.id);
    if (!profile) {
        return message.reply({
            content: "You don't have a profile yet! Create one with the `inventory` command!",
            ephemeral: true,
            allowedMentions: { repliedUser: false }
        })
    }

}

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(true)

// Create a the run script for the interaction command
module.exports.interaction = async (client, interaction) => {
    
    interaction.reply({ content: "This command is not yet available!", ephemeral: true })

}

