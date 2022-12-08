const Discord = require('discord.js');
const fs = require('fs');
const { dirname } = require('path');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command | category]',
    parameters: '<command | category>'
};

module.exports.execute = async (client, message, args) => {
    switch (args[0]) {
        case (client.commands.get(args[0])):
            const getCommand = client.commands.get(args[0]);
            const createCommandName = args[0].charAt(0).toUpperCase() + args[0].slice(1);

            const createCommandEmbed = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(createCommandName + " Help")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'Name', value: getCommand.help.name, inline: true },
                    { name: 'Aliases', value: getCommand.help.aliases, inline: true },
                    { name: 'Description', value: getCommand.help.description, inline: false},
                    { name: 'Usage', value: getCommand.help.usage, inline: true},
                    { name: 'Parameters', value: getCommand.help.parameters, inline: true},
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
                
            try {
                message.channel.send(createCommandEmbed)
            } catch (err) {
                console.log(err)
                message.channel.send("It's seems like the command do not exist.")
            }
            break;
        case 'oui':
            break;
        default:
            const createCategoriesEmbed = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(client.user.username + " commands")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Categories", value: 'List of every categories', inline: true },
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            // const categories = fs.readdirSync('./commands')
            // const directories = categories.filter(folder => fs.lstatSync(folder).isDirectory());
            // directories.forEach(dir => {
            //     dir.addFields({ name: dir, value: 'Field', inline: true})
            // })
            
            message.channel.send(createCategoriesEmbed)
            break;
    }
};