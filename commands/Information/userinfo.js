const Discord = require('discord.js');

module.exports.help = {
    name : "userinfo",
    description: 'Get someone\'s informations!',
    aliases : ['ui'],
    usage : '<none | usertag>'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        const personal = new Discord.MessageEmbed()
            .setAuthor(message.author.tag, client.user.displayAvatarURL({ dynamic : true }))
            .setTitle('ui')
            .setColor('RANDOM')
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                {name: `ID`, value: message.author.id, inline: true},
                {name: `Nickname`, value: message.author.displayname, inline: true},
                {name: `Badges`, value: 'Tro bg le tipe', inline: true},
                {name: `Account Creation`, value: message.author.createdAt, inline: true},
                {name: `Join Date`, value: message.author.joinedAt, inline: true}
            )
            .setImage(message.author.displayAvatarURL({ dynamic : true }))
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        
        message.channel.send(personal)
    }
};