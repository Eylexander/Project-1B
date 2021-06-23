const Discord = require('discord.js');
const settings = require('../settings.json');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');

module.exports.run = (client, message, args) => {
    client.commands = new Discord.Collection();
    let cmd = args[0];
    if (client.commands.has(cmd)) {
        command = client.commands.get(cmd) || 
        client.commands.find(cmmd => cmmd.aliases && cmmd.aliases.includes(cmd));
    }

    if (!args[0]) {
        // message.channel.send(command.tuto)
        message.channel.send("non")
        return 
    } else {
        // message.channel.send(`Description: ${command.description}\nTuto: ${settings.prefix}${command.name} ${command.tuto}`)
        message.channel.send('oui')
    }
}

module.exports.help = {
    name: "help",
    description: "Help command",
    aliases: ['h', 'halp'],
    tuto: '[command]',
}