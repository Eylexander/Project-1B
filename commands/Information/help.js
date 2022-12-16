const { channel } = require('diagnostics_channel');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const settings = require('../../settings.json');

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command | category]',
    parameters: '<command | category>'
};

module.exports.execute = async (client, message, args) => {
    const categories = fs.readdirSync('./commands')

    switch (args[0]) {
        case (client.commands.filter(cmd => cmd.help.category === args[0])):
            const getCommand = client.commands.get(args[0]);
            const createCommandName = args[0].charAt(0).toUpperCase() + args[0].slice(1);

            const createCommandEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
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
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                
            
            message.channel.send({ embeds: [createCommandEmbed] })
            break;
        case (categories.includes(args[0])):
            message.channel.send('Category');
        case undefined:
        case null:
            const createCategoriesEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(client.user.username + " commands")
                .setDescription("Use `" + settings.prefix + "help [command | category]` to get more information about a command or category.")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            for (const dir of categories) {
                createCategoriesEmbed.addFields({ name: dir, value: 'Category', inline: true})
            }
            
            message.channel.send({ embeds: [createCategoriesEmbed] })
            break;
        default:
            message.channel.send("I bugged")
            break;
    }
};