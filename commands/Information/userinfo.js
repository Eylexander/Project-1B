const moment = require('moment');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
	],
});

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
        case undefined || null:
            return message.channel.send({ embeds: [getPersonalEmbed] });
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

                return message.channel.send({ embeds: [getMentionEmbed] });
            } else {
                // if (args[0].match(/([0-9]*)/)) {
                //     const getMentionId = args[1].match(/([0-9]*)/)
                //     const getUserObjectId = client.users.cache.get(getMentionId[1]);

                //     const getMentionbyIdEmbed = new EmbedBuilder()
                //         .setAuthor(message.author.tag, client.user.displayAvatarURL({ dynamic : true }))
                //         .setTitle(getUserObjectId.username + '\'s Informations')
                //         .setColor(Math.floor(Math.random() * 16777214) + 1)
                //         .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                //         .addFields(
                //             {name: `ID`, value: getUserObjectId.id, inline: true},
                //             {name: `Status`, value: getUserObjectId.presence.status, inline: true},
                //             {name: `Account Creation`, value: moment.utc(getUserObjectId.createdAt).format('LLL'), inline: true},
                //             {name: `Join Date`, value: moment.utc(getUserObjectId.joinedAt).format('LLL'), inline: true}
                //         )
                //         .setImage(getUserObjectId.displayAvatarURL({ dynamic : true }))
                //         .setTimestamp()
                //         .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                //     return message.channel.send({ embeds: [getMentionbyIdEmbed] });
                // } else {
                    return message.channel.send({ embeds: [getPersonalEmbed] });
                // }
            }
            break;
    }
};