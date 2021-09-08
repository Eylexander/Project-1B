const Discord = require('discord.js');
const {prefix} = require('../settings.json');
const {command} = require('../events/message.js');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command]',
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        message.channel.send(`If you need some help!\nUsage: ${prefix}${module.exports.help.name} ${module.exports.help.usage}`)
    } else {
        // message.channel.send(`Description: ${command.description}\nUsage: ${prefix}${command.name} ${command.usage}`)
        message.channel.send(`Description : ${args.description}`);

        const help = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle("Help command")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: 'Test', value: 'Test', inline: true},
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        return message.channel.send(help);
    }
};