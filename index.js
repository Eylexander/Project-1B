const chalk = require('chalk');
const moment = require('moment');
const fs = require('node:fs');
const path = require('node:path');
const { token } = require('./settings.json');

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const client = new Client({
	partials: ["CHANNEL"],
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
client.commands = new Collection();

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Mana regeneration
require('./tools/economyHandler.js').onLoad();

// Reading all Event Files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	let eventName = file.split(".")[0];
	client.on(eventName, event.bind(null, client));
}

// Reading all Command Folders
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    log(`Loading Commands from Folder: ${folder}`)
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(path.parse(file).name, command);
    }
}

// InteractionCreate Event Temporary
const { onInteraction } = require('./tools/InteractionCreate.js');
client.on(Events.InteractionCreate, async interaction => {
	onInteraction(client, interaction);
});

client.login(token);