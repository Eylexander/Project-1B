const Discord = require('discord.js');
const settings = require('../settings.json');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');

module.exports = {
    name: "help",
    description: "Help command",
    tuto: `${settings.prefix}help [command]`,
    aliases: ['h', 'halp'],
    async execute(client, message, args) {
        if (!args[0]) {
            return message.channel.send("cheh");
        } else {
            let cmd = args[0];
            if (client.commands.has(cmd)) {
                cmd = client.commands.get(cmd) || 
                client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(cmd));
            message.channel.send(`Description: ${cmd.description}\nTuto: ${settings.prefix}${cmd.name} [command]`)
            }
        }
    }
}