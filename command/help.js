const Discord = require('discord.js');
const {prefix} = require('../settings.json');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');
const command = require('../events/message.js');
const client = new Discord.Client();
client.commands = new Discord.Collection();

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command]',
};

module.exports.execute = async (client, message, args) => {

    // let cmd = args[0];

    // if (client.commands.has(cmd)) {
    //     const command = 
    //         client.commands.get(cmd) ||
    //         client.commands.find(cmmd => cmmd.aliases && cmmd.aliases.includes(cmd));
    // };

    if (!args[0]) {
        message.channel.send(command.usage)
    } else {
        message.channel.send(`Description: ${command.description}\nUsage: ${prefix}${command.name} ${command.usage}`)
    }
};