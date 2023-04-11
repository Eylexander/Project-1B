const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const moment = require('moment');
const chalk = require('chalk');

// Create better console logs
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

    // 
    
    // Get the meme from the API
    const request = args[0] === undefined ? '' :
                ['image', 'video'].includes(args[0].toLowerCase()) ? args[0].toLowerCase() :
                '';

    const { data } = await axios.get('https://memes.eylexander.xyz/api/v1/' + request);

    // Create the embed
    const makeEmbed = new EmbedBuilder()
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setTitle(data.name.toString())
        .setURL(data.url)
        .setDescription('If the image is not loading, click the title to open the image in a new tab.')
        .setImage(data.url.toString())
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

    // Send the embed
    return message.reply({
        embeds: [makeEmbed],
        allowedMentions: { repliedUser: false }
    })
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
        
        // Get the meme from the API
        const { data } = await axios.get('https://memes.eylexander.xyz/api/v1/');
        
        // Create the embed
        const makeEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTitle(data.name.toString())
            .setURL(data.url)
            .setDescription('If the image is not loading, click the title to open the image in a new tab.')
            .setImage(data.url.toString())
            .setTimestamp()
            .setFooter({ text :`Requested by ${interaction.member.user.username}`, iconURL: interaction.member.user.displayAvatarURL({ dynamic: true })})
    
        // Send the embed
        return interaction.reply({
            embeds: [makeEmbed],
            allowedMentions: { repliedUser: false }
        })
};