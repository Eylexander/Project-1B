const Discord = require('discord.js');
const fs = require('fs')
const { prefix } = require('../../settings.json');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command]',
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        const categories = fs.readdirSync('../../commands');

        // message.guild.members.cache.filter(m => m.hasPermission('ADMINISTRATOR')).map(m=>m.user.tag).join('\n')

        const global = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle(client.user.username + " commands")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: "Categories", value: "oui", inline: true }
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        
        message.channel.send(global)
    } else {
        let cmd = args[0].toLowerCase();
        const command = client.commands.get(cmd)
        const cmdname = cmd.charAt(0).toUpperCase() + cmd.slice(1)

        // var desc  = command.map(cmd => `**${cmd.name}**: ${cmd.description || 'No description available.'}`)

        try {
            const info = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(cmdname + " Help")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'Name', value: command.help.name, inline: true },
                    { name: 'Aliases', value: command.help.aliases, inline: true },
                    { name: 'Description', value: command.help.description, inline: false},
                    { name: 'Usage', value: command.help.usage, inline: true}
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
                
            message.channel.send(info)
        } catch (err) {
            console.log(err)
            message.channel.send("It's seems like the command do not exist.")
        }
    }
};