const Discord = require('discord.js');
const {prefix} = require('../settings.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();

module.exports = (client, message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;

    // if (message.content.indexOf(prefix) !== 0) return;
  
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
  
    const command = 
      client.commands.get(cmd) ||
      client.commands.find((cmmd) => cmmd.aliases && cmmd.aliases.includes(cmd));
  
    try {
      command.run(client, message, args);
    } catch (error) {
      console.error(error);
    }
};