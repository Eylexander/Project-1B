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
const sql = new db('./database/stats.sqlite');
client.on('ready', () => { dbUtils.initDatabases(sql) })

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

client.login(token);