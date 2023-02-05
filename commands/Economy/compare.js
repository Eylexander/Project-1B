const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');

// Create the json script for the help command
module.exports.help = {
    name : "compare",
    description: 'Compare your stats with another user.',
    aliases : ['flex'],
    usage : '[stats]',
    parameters: '<stats>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Creation of a function to capitalize the first letter of a string
    const makeName = (name) => name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);

    // Create default leaderboard
    const getStatsLeaderBoard = inv.prepare("SELECT * FROM stats ORDER BY money DESC LIMIT 10;").all();

    // Create a new embed
    const createMoneyLeaderBoard = new EmbedBuilder()
        .setTitle('Top 10 Money Leaderboard')
        .setColor(Math.floor(Math.random()*16777215) + 1)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields()
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    // Create a leaderboard
    let counter = 1;
    for (const user in getStatsLeaderBoard) {
        createMoneyLeaderBoard.addFields({
            name: `${counter}. ${getStatsLeaderBoard[user].user}`,
            value: `**${getStatsLeaderBoard[user].money}** $`,
        });
        counter++;
    }

    // Check if the user has specified what stats he wants to compare
    if (!args[0])
    return message.reply({
        embeds: [createMoneyLeaderBoard],
        allowedMentions: { repliedUser: false }
    });

    // Check if there is not too many arguments
    if (args.length > 1)
    return message.reply({ content: 'Please only specify one stat and/or one user.', allowedMentions: { repliedUser: false } });

    // Check if stats is a valid stat
    const getStatsColumns = inv.prepare("SELECT * FROM stats;").columns().map(c => c.name);

    // If the stat is valid, continue
    if (getStatsColumns.includes(args[0].toLowerCase()) && !['user', 'id', 'money'].includes(args[0].toLowerCase())) {
        const getStatsLeaderBoard = inv.prepare("SELECT * FROM stats ORDER BY ? DESC LIMIT 10;").all(args[0].toLowerCase());

        // Create a new embed
        const createBasicLeaderBoard = new EmbedBuilder()
            .setTitle(`Top 10 ${makeName(args[0])} Leaderboard`)
            .setColor(Math.floor(Math.random()*16777215) + 1)
            .setThumbnail(client.user.displayAvatarURL())
            .addFields()
            .setTimestamp()
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });
    
        // Create a leaderboard
        let counter = 1;
        for (const user in getStatsLeaderBoard) {
            createBasicLeaderBoard.addFields({
                name: `${counter}. ${getStatsLeaderBoard[user].user}`,
                value: `**${getStatsLeaderBoard[user][args[0].toLowerCase()]}** ${makeName(args[0])}`,
            });
            counter++;
        }
    
        // Send the embed
        message.reply({
            embeds: [createBasicLeaderBoard],
            allowedMentions: { repliedUser: false }
        })
    } else {

        // Send the basic money leaderboard embed 
        message.reply({
            embeds: [createMoneyLeaderBoard],
            allowedMentions: { repliedUser: false }
        })
    }

};

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('stats')
            .setDescription('The stats you want to compare')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('user')
            .setDescription('The user you want to compare with')
            .setRequired(false))
    .setDMPermission(true);

// Create the run script for the interaction command
module.exports.run = async (client, interaction) => {

    message.reply({
        content: 'This command is not available yet.',
        allowedMentions: { repliedUser: false }
    })

};