const Discord = require('discord.js');
const fs = require('fs');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command]',
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        folderslist = []
        const categories = fs.readdirSync('./commands').join('\n')
        // Listing all folders
        // let folderslist = []
        // fs.readdir('./commands/', function(folders) {
        //     folders.forEach(function(folder) {
        //         folderslist << folder
        //     })
        // })
        // message.channel.send(folderslist)

        const global = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle(client.user.username + " commands")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: "Categories", value: `${categories}`, inline: true },
                // {name: `Oui`, value: 'non', inline: true}
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        
        message.channel.send(global)
    } else {
        let cmd = args[0].toLowerCase();
        const command = client.commands.get(cmd)
        const cmdname = cmd.charAt(0).toUpperCase() + cmd.slice(1)

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