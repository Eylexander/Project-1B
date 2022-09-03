const Discord = require('discord.js');
const settings = require('../../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "emoji",
    description: 'Show custom Emojis from your server.',
    aliases : ['emote'],
    usage : '[emoji]'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) return message.channel.send(`You must provide an emoji to check. See \`\`${settings.prefix}help emoji\`\` for more informations.`);
    try {
        const emoteRegex = args[0].match(/<:.+:(\d+)>/)
        const animatedEmoteRegex = args[0].match(/<a:.+:(\d+)>/)

        const unicodeEmoji = args[0].match(/((?<!\\)<:[^:]+:(\d+)>)|\p{Emoji_Presentation}|\p{Extended_Pictographic}/gmu);

        if (emoji = emoteRegex) {
            message.channel.send(`https://cdn.discordapp.com/emojis/${emoji[1]}.png?v=1`)
        }
        else if (emoji = animatedEmoteRegex) {
            message.channel.send(`https://cdn.discordapp.com/emojis/${emoji[1]}.gif?v=1`)
        }
        else if (emoji = unicodeEmoji) {
            message.channel.send(`${unicodeEmoji}`)
        }
    } catch (err) {
        log(err)
        message.reply("I won't work")
    }
};