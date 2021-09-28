const Discord = require('discord.js');
const { prefix } = require('C:/Users/Eylexander/Desktop/Projets/Project-1B/settings.json');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command]',
};

module.exports.execute = async (client, message, args) => {
    let cmd = args[0];

    const command = client.commands.get(cmd)
    const commandalias = client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

    var desc  = command.map(cmd => `**${cmd.name}**: ${cmd.description || 'No description available.'}`)

    if (!args[0]) {
        message.channel.send(`If you need some help!\nUsage: ${prefix}${module.exports.help.name} ${module.exports.help.usage}`)
    } else {
        // message.channel.send(`Description: ${command.description}\nUsage: ${prefix}${command.name} ${command.usage}`)
        message.channel.send(`Description : ${command.help.description}`);

        const help = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle("Help command")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: 'Commandes', value: desc.join('\n'), inline: true },
                { name: 'Aliases', value, commandalias, inline: true}
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        return message.channel.send(help);
    }
};