const Discord = require('discord.js');
const {prefix} = require('../settings.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();

module.exports = (client, message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    
    
    const command = client.commands.get(cmd)
      || client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

    // If the command has not been found, return.
    if (command == null) return;
    
    try {
      command.execute(client, message, args);
    } catch (error) {
      console.error(error);
      message.reply('Once again , a stupid error!')
    }
};