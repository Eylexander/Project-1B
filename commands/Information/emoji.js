const Discord = require('discord.js');
const settings = require('../../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name: "emoji",
    description: 'Show custom Emojis from your server.',
    aliases: ['emote'],
    usage: '[emoji]',
    parameters: '<emoji>'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) return message.channel.send(`You must provide an emoji to check. See \`\`${settings.prefix}help emoji\`\` for more informations.`);
    try {
        const emoteRegex = args[0].match(/<:.+:(\d+)>/)
        const animatedEmoteRegex = args[0].match(/<a:.+:(\d+)>/)
        const unicodeEmoji = args[0].match(/((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu);

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
        log(err)
        message.reply("I won't work")
    }
};

module.exports.data = new Discord.SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('emoji')
            .setDescription('The emoji you want to check.')
            .setRequired(true))
    .setDMPermission(false) 

module.exports.run = async (client, interaction) => {
    try {
        const emoteRegex = interaction.options.getString('emoji').match(/<:.+:(\d+)>/)
        const animatedEmoteRegex = interaction.options.getString('emoji').match(/<a:.+:(\d+)>/)
        const unicodeEmoji = interaction.options.getString('emoji').match(/((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu);

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
        log(err)
        interaction.reply("I won't work")
    }
};