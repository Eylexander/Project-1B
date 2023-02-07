const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const db = require("better-sqlite3");
const ser = new db('./database/devtools/server.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "prefix",
    aliases: ['call'],
    description: "See the prefix for the server",
    usage: "<none>",
    parameters: "<none>",
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if there is a parameter and user has permission
    if (['drop', 'delete', 'remove'].includes(args[0]) && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        ser.prepare("DELETE FROM server WHERE id = ?;").run(message.guild.id);
        return message.reply({
            content: "The prefix has been reset to `+`",
            allowedMentions: { repliedUser: false }
        });
    }

    // Get server settings
    let settings = ser.prepare("SELECT * FROM server WHERE id = ?;").get(message.guild.id);
    
    if (!settings) {
        message.reply({
            content: "My prefix is `+`",
            allowedMentions: { repliedUser: false }
        })
    } else {
        message.reply({
            content: `My prefix is \`${settings.prefix}\``,
            allowedMentions: { repliedUser: false }
        })
    }

};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('prefix')
            .setDescription('The new prefix')
            .setRequired(true))
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    interaction.reply("This command is not ready yet !");
};