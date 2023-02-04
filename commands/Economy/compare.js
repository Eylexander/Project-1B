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

    // Check if the user has specified what stats he wants to compare
    if (!args[0]) return message.reply({ content: 'Please specify what stats you want to compare.', allowedMentions: { repliedUser: false } });
    // Check if there is not too many arguments
    if (args.length > 1) return message.reply({ content: 'Please only specify one stat and/or one user.', allowedMentions: { repliedUser: false } });

    // Check if stats is a valid stat
    // const getStatsColumns = inv.prepare("PRAGMA table_info(stats);").all();

    const getStatsLeaderBoard = inv.prepare("SELECT * FROM stats ORDER BY ? DESC LIMIT 10;").all(args[0]);

    // Create a new embed
    const createBasicLeaderBoard = new EmbedBuilder()
        .setTitle(`Top 10 ${args[0]} Leaderboard`)
        .setColor(Math.floor(Math.random()*16777215) + 1)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields()
        .setTimestamp()
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    // Create a leaderboard
    for (const user in getStatsLeaderBoard) {
        // createBasicLeaderBoard.addField(`${getStatsLeaderBoard[user].user}`, `**${getStatsLeaderBoard[user].mana}** oui`);
        createBasicLeaderBoard.addFields({
            name: `${getStatsLeaderBoard[user].user}`,
            value: `**${getStatsLeaderBoard[user].mana}** oui`,
        });
    }

    // Send the embed
    message.channel.send({ embeds: [createBasicLeaderBoard] });

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

};