const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { randomColor } = require('../../tools/Loader.js');
const db = require('better-sqlite3');
const wordsDB = new db('./database/devtools/words.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: 'rickroll',
    description: 'Rickroll the people',
    aliases: ['rick', 'troll', 'rr'],
    usage: '[user]',
    parameters: '<user>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Get the rickroll list at every iteration of the command (in case of a new word added)
    const rickrollList = wordsDB.prepare("SELECT word FROM words WHERE type = 'rickroll';").all().map((w) => w.word);

    // Construct the rickroll gif array
    const rickrollGifs = rickrollList[Math.floor(Math.random() * rickrollList.length)];

    // Check if the user has entered a user to rickroll
    if (!message.mentions.users.first()) {
        // If not, send a message and delete it after 2.5 seconds
        return message.reply({
            content: "You have to tag someone !",
            allowedMentions: { repliedUser: false }
        }).then(message => {
            // Delete the message after 2.5 seconds
            setTimeout(() => { message.delete() }, 2500)
        });

    } else {
        // If yes, send a message with the rickroll gif
        // Get the user mention
        const userMention = message.mentions.users.first();

        // Create the embed
        const RickrollEmbed = new EmbedBuilder()
            .setColor(randomColor())
            .setDescription(`**${message.author.username}** rickrolled **${userMention.username}** !`)
            .setImage(rickrollGifs)
            .setTimestamp()
            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

        // Send the embed
        return message.reply({
            embeds: [RickrollEmbed],
            allowedMentions: { repliedUser: false }
        })
    }
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option => 
        option
            .setName('user')
            .setDescription('The user to rickroll')
            .setRequired(true))
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    // Get the rickroll list at every iteration of the command (in case of a new word added)
    const rickrollList = wordsDB.prepare("SELECT word FROM words WHERE type = 'rickroll';").all().map((w) => w.word);

    // Construct the rickroll gif array
    const rickrollGifs = rickrollList[Math.floor(Math.random() * rickrollList.length)];

    // Get the user mention
    const userMention = interaction.options.getUser('user');

    // Create the embed
    const RickrollEmbed = new EmbedBuilder()
        .setColor(randomColor())
        .setDescription(`**${interaction.member.user.username}** rickrolled **${userMention.username}** !`)
        .setImage(rickrollGifs)
        .setTimestamp()
        .setFooter({ text :`Requested by ${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

    // Send the embed
    return interaction.reply({ embeds: [RickrollEmbed] });
};