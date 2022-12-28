const moment = require('moment');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports.help = {
    name : "userinfo",
    description: 'Get someone\'s informations!',
    aliases : ['ui', 'uid'],
    usage : '<none | usertag>',
    parameters: '<usertag>'
};

module.exports.execute = async (client, message, args) => {
// Defining all variables
        
    // const filteredRoles = message.member.roles.cache.filter(role => role.id != message.guild.id);
    // const listedRoles = filteredRoles.sort((a, b) => b.position - a.position).map(role => role.toString()); 
    // const listedRoles = message.member.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());
    
    const getPersonalEmbed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic : true })})
        .setTitle(message.author.username + '\'s Informations')
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `ID`, value: message.author.id, inline: false},
            // {name: `Status`, value: message.author.presence.status, inline: true},
            {name: `Account Creation`, value: moment.utc(message.author.createdAt).format('LLL'), inline: true},
            {name: `Join Date`, value: moment.utc(message.author.joinedAt).format('LLL'), inline: true}
        )
        .setImage(message.author.displayAvatarURL({ dynamic : true }))
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
    
    switch (args[0]) {
        case undefined:
        case null:
            message.channel.send({ embeds: [getPersonalEmbed] });
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();

                const getMentionEmbed = new EmbedBuilder()
                    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic : true })})
                    .setTitle(getMentionTag.username + '\'s Informations')
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                    .addFields(
                        {name: `ID`, value: getMentionTag.id, inline: false},
                        // {name: `Status`, value: getMentionTag.presence.status, inline: true},
                        {name: `Account Creation`, value: moment.utc(getMentionTag.createdAt).format('LLL'), inline: true},
                        {name: `Join Date`, value: moment.utc(getMentionTag.joinedAt).format('LLL'), inline: true}
                    )
                    .setImage(getMentionTag.displayAvatarURL({ dynamic : true }))
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                message.channel.send({ embeds: [getMentionEmbed] });

            } else { message.channel.send({ embeds: [getPersonalEmbed] }) }
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user\'s informations you want to get!')
            .setRequired(false))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    if (!interaction.options.getUser('user')) {
        const getPersonalEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic : true })})
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .setTitle(interaction.user.username + '\'s Informations')
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .addFields(
                {name: `ID`, value: interaction.member.user.id, inline: false},
                // {name: `Status`, value: interaction.user.presence.status, inline: true},
                {name: `Account Creation`, value: moment.utc(interaction.member.user.createdAt).format('LLL'), inline: true},
                {name: `Join Date`, value: moment.utc(interaction.member.user.joinedAt).format('LLL'), inline: true}
            )
            .setImage(interaction.user.displayAvatarURL({ dynamic : true }))
            .setTimestamp()
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})

        interaction.reply({ embeds: [getPersonalEmbed] });
    } else {
        const getMentionTag = interaction.options.getUser('user');
        
        const getMentionEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.member.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic : true })})
            .setTitle(getMentionTag.username + '\'s Informations')
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                {name: `ID`, value: getMentionTag.id, inline: false},
                // {name: `Status`, value: getMentionTag.presence.status, inline: true},
                {name: `Account Creation`, value: moment.utc(getMentionTag.createdAt).format('LLL'), inline: true},
                {name: `Join Date`, value: moment.utc(getMentionTag.joinedAt).format('LLL'), inline: true}
            )
            .setImage(getMentionTag.displayAvatarURL({ dynamic : true }))
            .setTimestamp()
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true })})

        interaction.reply({ embeds: [getMentionEmbed] });
    }
};