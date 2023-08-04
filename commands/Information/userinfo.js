const moment = require('moment');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { randomColor } = require('../../tools/Loader');

// Create the json script for the help command
module.exports.help = {
    name : "userinfo",
    description: 'Get someone\'s informations!',
    aliases : ['ui', 'uid'],
    usage : '<none | usertag>',
    parameters: '<usertag>'
};

// Create the json script for the slash command
module.exports.execute = async (client, message, args) => {

    // Defining all variables    
    // const filteredRoles = message.member.roles.cache.filter(role => role.id != message.guild.id);
    // const listedRoles = filteredRoles.sort((a, b) => b.position - a.position).map(role => role.toString()); 
    // const listedRoles = message.member.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());

    let userObject;
    Boolean(message.mentions.users.first()) ? userObject = message.mentions.users.first() : userObject = message.author;
    
    // Create the embed
    const responseEmbed = new EmbedBuilder()
        .setAuthor({ name: userObject.tag, iconURL: userObject.displayAvatarURL({ dynamic : true })})
        .setTitle(userObject.username + '\'s Informations')
        .setColor(randomColor())
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `ID`, value: userObject.id, inline: false},
            // {name: `Status`, value: userObject.presence.status, inline: true},
            {name: `Account Creation`, value: moment.utc(userObject.createdAt).format('LLL'), inline: true},
            {name: `Join Date`, value: moment.utc(userObject.joinedAt).format('LLL'), inline: true}
        )
        .setImage(userObject.displayAvatarURL({ dynamic : true }))
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})


    // Send the embed
    message.reply({
        embeds: [responseEmbed],
        allowedMentions: { repliedUser: false }
    })
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user\'s informations you want to get!')
            .setRequired(false))
    .setDMPermission(false)

// Create the json script for the slash command
module.exports.run = async (client, interaction) => {

    let userObject;
    Boolean(interaction.options.getUser('user')) ? userObject = interaction.options.getUser('user') : userObject = interaction.user;

    // Create the embed
    const responseEmbed = new EmbedBuilder()
        .setAuthor({ name: userObject.tag, iconURL: userObject.displayAvatarURL({ dynamic : true })})
        .setTitle(userObject.username + '\'s Informations')
        .setColor(randomColor())
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `ID`, value: userObject.id, inline: false},
            // {name: `Status`, value: userObject.presence.status, inline: true},
            {name: `Account Creation`, value: moment.utc(userObject.createdAt).format('LLL'), inline: true},
            {name: `Join Date`, value: moment.utc(userObject.joinedAt).format('LLL'), inline: true}
        )
        .setImage(userObject.displayAvatarURL({ dynamic : true }))
        .setTimestamp()
        .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

    // Send the embed
    interaction.reply({ embeds: [responseEmbed] })
};