const chalk = require('chalk');
const moment = require('moment');
const fs = require('node:fs');
const path = require('node:path');
const { token } = require('./settings.json');

const Loader = require('./tools/Loader.js');

const {
	Client,
	GatewayIntentBits,
	Collection,
	Events
} = require('discord.js');

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

// Initialize databases
Loader.initDatabases();

// Reading all Event Files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	let eventName = file.split(".")[0];
	// client.on(Events[eventName], event.bind(null, client));
	if (event.once) {
		client.once(Events[eventName], (...args) => event.execute(...args));
	} else {
		client.on(Events[eventName], (...args) => event.execute(client, ...args));
	}
}

// InteractionCreate Event Handler
client.on(Events.InteractionCreate, async interaction => {
	Loader.onInteraction(client, interaction);
});

// Reading all Command Folders
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
    Loader.logToConsole(`Loading Commands from Folder: ${folder}`)
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(path.parse(file).name, command);
    }
}

// Login the bot
console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`));
client.login(token);