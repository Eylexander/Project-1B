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
        message.channel.send(`Description: ${module.exports.help.description}\nUsage: ${prefix}${module.exports.help.name} ${module.exports.help.usage}`)
    } else {
        // message.channel.send(`Description: ${command.description}\nUsage: ${prefix}${command.name} ${command.usage}`)
        message.channel.send(`Description : ${args.description}`);
    }
};