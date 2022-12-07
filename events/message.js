const Discord = require('discord.js');
const {prefix} = require('../settings.json');
const client = new Discord.Client();
client.commands = new Discord.Collection();

const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');

module.exports = (client, message) => {
    if(message.author.bot) return;
    if(ban.prepare(`SELECT id FROM ban WHERE id = ?;`).get(message.author.id)) return message.author.send("You are banned from using this bot.");
    if(message.content.startsWith(prefix)) {
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
    }
        
    
};