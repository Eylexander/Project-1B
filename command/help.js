const Discord = require('discord.js');
const settings = require('../settings.json');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');

module.exports = {
    name: "help",
    description: "Help command",
    aliases: ['h', 'halp'],
    tuto: '[command]',
    async execute(client, message, args) {

        let cmd = args[0];
        if (client.commands.has(cmd)) {
            cmd = client.commands.get(cmd) || 
            client.commands.find((cmmd) => cmmd.aliases && cmmd.aliases.includes(cmd));
        }

        if (!args[0]) {return message.channel.send(cmd.tuto)} 
        else {
            message.channel.send(`Description: ${cmd.description}\nTuto: ${settings.prefix}${cmd.name} ${cmd.tuto}`)
        }
    }
}