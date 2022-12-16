const { prefix } = require('../settings.json');
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
client.commands = new Collection();

const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');
const { onMessage } = require('../tools/message_listener.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    // execute(message) {
    //     if (message.author.bot) return;
    //     if(message.content.startsWith(prefix)) {
    //         if(ban.prepare(`SELECT id FROM ban WHERE id = ?;`).get(message.author.id)) return message.author.send("You are banned from using this bot.");
    //         const args = message.content.slice(prefix.length).trim().split(/ +/);
    //         const cmd = args.shift().toLowerCase();

    //         const command = client.commands.get(cmd)
    //         || client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

    //         // If the command has not been found, return.
    //         if (command == null) return console.log(`Command ${cmd} not found`);

    //         try {
    //             command.execute(client, message, args);
    //         } catch (error) {
    //             console.error(error);
    //             message.reply('Once again , a stupid error!')
    //         }
    //     }
    // },
    execute() {
        onMessage.bind(null, client);
    }
}