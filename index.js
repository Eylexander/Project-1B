const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const { token } = require('./settings.json');

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
client.commands = new Collection();

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// WordReading System
const { onMessage } = require('./tools/message_listener.js');
client.on('messageCreate', onMessage.bind(null, client));

// Reading all Event Files

// const events = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
// for (const file of events) {
//   const eventName = file.split(".")[0];
//   const event = require(`./events/${file}`);
//   client.on(eventName, event.bind(null, client));
// }

// Temparily Added
const path = require('node:path');
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
// End of Temporarily Added

// Reading all Command Folders
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    log(`Loading Commands from Folder: ${folder}`)
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.help.name, command);
    }
}

// Temporarily Added
const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');
const { prefix } = require('./settings.json');

client.on('messageCreate', (message) => {
	if (message.author.bot) return;

    if(message.content.startsWith(prefix)) {
		if(ban.prepare(`SELECT id FROM ban WHERE id = ?;`).get(message.author.id)) return message.author.send("You are banned from using this bot.");
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
});
// End of Temporarily Added

client.login(token);