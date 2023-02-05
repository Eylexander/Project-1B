const { SlashCommandBuilder } = require('discord.js');
const settings = require('../../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Create the json script for the help command
module.exports.help = {
    name: "emoji",
    description: 'Show custom Emojis from your server.',
    aliases: ['emote'],
    usage: '[emoji]',
    parameters: '<emoji>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if there is an input
    if (!args[0])
    return message.reply({
        content: `You must provide an emoji to check. \nSee \`/help emoji\` for more informations.`,
        allowedMentions: { repliedUser: false }
    })

    // Check if the input is a custom emoji
    try {
        // Check the different types of emojis
        const emoteRegex = args[0].match(/<:.+:(\d+)>/)
        const animatedEmoteRegex = args[0].match(/<a:.+:(\d+)>/)
        const unicodeEmoji = args[0].match(/((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu);

        // If the input is a custom emoji, send the image
        if (emoji = emoteRegex) {
            return message.channel.send(`https://cdn.discordapp.com/emojis/${emoji[1]}.png?v=1`)
        }
        else if (emoji = animatedEmoteRegex) {
            return message.channel.send(`https://cdn.discordapp.com/emojis/${emoji[1]}.gif?v=1`)
        }
        else if (emoji = unicodeEmoji) {
            return message.channel.send(`${unicodeEmoji}`)
        }
    } catch (err) {
        // If there is an error, log it
        log(err)
    }
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('emoji')
            .setDescription('The emoji you want to check.')
            .setRequired(true))
    .setDMPermission(false) 

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {

    // Check if the input is a custom emoji
    try {
        // Check the different types of emojis
        const emoteRegex = interaction.options.getString('emoji').match(/<:.+:(\d+)>/)
        const animatedEmoteRegex = interaction.options.getString('emoji').match(/<a:.+:(\d+)>/)
        const unicodeEmoji = interaction.options.getString('emoji').match(/((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu);

        // If the input is a custom emoji, send the image
        if (emoji = emoteRegex) {
            interaction.reply(`https://cdn.discordapp.com/emojis/${emoji[1]}.png?v=1`)
        }
        else if (emoji = animatedEmoteRegex) {
            interaction.reply(`https://cdn.discordapp.com/emojis/${emoji[1]}.gif?v=1`)
        }
        else if (emoji = unicodeEmoji) {
            interaction.reply(`${unicodeEmoji}`)
        }
    } catch (err) {
        // If there is an error, log it
        log(err)
    }
};