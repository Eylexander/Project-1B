const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require('./settings.json');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
client.commands = new Discord.Collection();

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// WordReading System
const { onMessage } = require('./tools/message_listener.js')
client.on('message', onMessage.bind(null, client))

// Database Utils
const dbUtils = require('./tools/dbUtils.js')
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');
const sent = new db('./database/infos.sqlite');
const dev = new db('./database/devtool.sqlite');
// const ban = new db('./database/blockedusers.sqlite');
client.on('ready', () => { dbUtils.initDatabases(inv, sent, dev,
    //  ban
     ) })

// Reading all Event Files
fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach((file) => {
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
    });
});

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

// Recycling users
// const getban = ban.prepare("SELECT * FROM ban WHERE id = ?;");
// const blockedUsers = getban.get()
// client.on('interactionCreate', async interaction => {
// 	if (blockedUsers.includes(interaction.user.id)) return;
// });

client.login(token);