const Discord = require('discord.js');
const moment = require('moment');

module.exports.help = {
    name : "userinfo",
    description: 'Get someone\'s informations!',
    aliases : ['ui', 'uid'],
    usage : '<none | usertag>'
};

module.exports.execute = async (client, message, args) => {
    // Defining all variables
    
    
    

    const personal = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, client.user.displayAvatarURL({ dynamic : true }))
        .setTitle(message.author.username + '\'s Informations')
        .setColor('RANDOM')
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `ID`, value: message.author.id, inline: true},
            {name: `Status`, value: message.author.presence.status, inline: true},
            {name: `Account Creation`, value: moment.utc(message.author.createdAt).format('LLL'), inline: true},
            {name: `Join Date`, value: moment.utc(message.author.createdAt).format('LLL'), inline: true}
        )
        .setImage(message.author.displayAvatarURL({ dynamic : true }))
        .setTimestamp()
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    if (!args[0]) {
        message.channel.send(personal)
    } else {
        const userMention = args[0].match(/<@!?([0-9]*)>/)
        if (userMention == null) {
            return message.channel.send(personal)
        } else {
            const usercalled = client.users.cache.get(userMention[1])

            

            const external = new Discord.MessageEmbed()
                .setAuthor(message.author.tag, client.user.displayAvatarURL({ dynamic : true }))
                .setTitle(usercalled.name + '\'s Informations')
                .setColor('RANDOM')
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    {name: `ID`, value: usercalled.id, inline: true},
                    {name: `Status`, value: usercalled.presence.status, inline: true},
                    {name: `Account Creation`, value: moment.utc(usercalled.createdAt).format('LLL'), inline: true},
                    {name: `Join Date`, value: moment.utc(usercalled.joinedAt).format('LLL'), inline: true}
                )
                .setImage(usercalled.displayAvatarURL({ dynamic : true }))
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            message.channel.send(external)
        }
    }
};