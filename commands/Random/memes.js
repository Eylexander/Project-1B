const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const moment = require('moment');
const chalk = require('chalk');

// Create better console logs
console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Create the json script for the help command
module.exports.help = {
    name: 'memes',
    description: 'Get a random meme from my collection API',
    aliases: ['meme'],
    usage: '',
    parameters: ''
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    
        // Get the meme from the API
        axios.get('https://api.eylexander.xyz/').then(data => {
    
            // Create the embed
            const makeEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setDescription(`**${data.name}**`)
                .setImage(data.url)
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
    
            // Send the embed
            return message.reply({
                embeds: [makeEmbed],
                allowedMentions: { repliedUser: false }
            })

        }).catch(error => {
            log(error)
            // If an error occurs, send a message and delete it after 2.5 seconds
            return message.reply({
                content: "An error occured while getting the meme !",
                allowedMentions: { repliedUser: false }
            }).then(message => {
                // Delete the message after 2.5 seconds
                setTimeout(() => { message.delete() }, 2500)
            });
        })
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {};