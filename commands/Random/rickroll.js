const Discord = require('discord.js');
const { ricks } = require('../../tools/word_libraries.json')

module.exports.help = {
    name : "rickroll",
    description: 'Rickroll the people',
    aliases : ['rick', 'troll', 'rr'],
    usage : '[user]'
};

module.exports.execute = async (client, message, args) => {
    const userMention = args[0].match(/<@!?([0-9]*)>/)

    if (!args[0] || userMention == null) {
        return message.channel.send('You have to tag someone !');
    } else {
        const user = client.users.cache.get(userMention[1])
        
        const embed = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setDescription(`**${message.author.username}** rickrolled **${user.username}** !`)
            .setImage(ricks[Math.floor(Math.random()*ricks.length)])
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        return message.channel.send(embed);
    }
};