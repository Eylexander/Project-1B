const { SlashCommandBuilder, PermissionsBitField  } = require('discord.js');
const db = require("better-sqlite3");

const serverListDB = new db('./database/devtools/server.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "setprefix",
    aliases: ['setcall'],
    description: "Set the prefix for the server",
    usage: "<new prefix>",
    parameters: "<new prefix>",
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user has the permission to use this command
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        setTimeout(() => {message.delete()}, 1000);
        return message.reply({
            content: "You need to be an administrator to use this command !",
            allowedMentions: { repliedUser: true }
        }).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

    // Check if there is a parameter
    if (['drop', 'delete', 'remove'].includes(args[0])) {
        serverListDB
            .prepare("DELETE FROM server WHERE id = ?;")
            .run(message.guild.id);
        return message.reply({
            content: "The prefix has been reset to `+`",
            allowedMentions: { repliedUser: false }
        });
    }

    // Check the input length
    if (args.length < 1) 
    return message.reply({
        content: "You need to specify a new prefix !",
        allowedMentions: { repliedUser: false }
    });
    
    // Create a function to set the prefix
    serverListDB
        .prepare("INSERT OR REPLACE INTO server (id, server, prefix, language) VALUES (@id, @server, @prefix, @language);")
        .run({
            id: message.guild.id,
            server: message.guild.name,
            prefix: args[0],
            language: "en"
        });

    // Send a message to the user
    message.reply({
        content: `The prefix has been set to \`${args[0]}\``,
        allowedMentions: { repliedUser: false }
    });
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