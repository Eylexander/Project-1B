const Discord = require('discord.js');

module.exports.help = {
    name : "userinfo",
    description: 'Get someone\'s informations!',
    aliases : ['ui'],
    usage : '<none | usertag>'
};

module.exports.execute = async (client, message, args) => {
    const personal = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, client.user.displayAvatarURL({ dynamic : true }))
        .setTitle(message.author.name + '\'s Informations')
        .setColor('RANDOM')
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `ID`, value: message.author.id, inline: true},
            {name: `Nickname`, value: message.author.displayname, inline: true},
            {name: `Account Creation`, value: message.author.createdAt, inline: true},
            {name: `Join Date`, value: message.author.joinedAt, inline: true}
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
                    {name: `Nickname`, value: usercalled.displayname, inline: true},
                    {name: `Account Creation`, value: usercalled.createdAt, inline: true},
                    {name: `Join Date`, value: usercalled.joinedAt, inline: true}
                )
                .setImage(usercalled.displayAvatarURL({ dynamic : true }))
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            message.channel.send(external)
        }
    }
};