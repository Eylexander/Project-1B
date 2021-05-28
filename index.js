const Discord = require('discord.js');
const client = new Discord.Client();
const {token, prefix} = require('./settings.json');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
client.commands = new Discord.Collection();

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Debug command
client.on('message', message => {
  if (message.author.bot) return;
  if (message.content === 'hey') {
    message.reply("I do work for now!");
  };
});

// Reading all Event Files
fs.readdir("./events/", (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
  });
});

// Reading all Command Files
fs.readdir('./command/', (err, file) => {
  if (err) return log(err);
  if (file.length <= 0) {return log(chalk.bgRed('There is no files in ./command/'))};
  log(`Loading a total of ${file.length} commands.`);
  file.forEach((file) => {
    if (!file.endsWith('.js')) return;
    let props = require(`./command/${file}`);
    let commandName = file.split(".")[0];
    log(`Loading Command: ${commandName}`);
    client.commands.set(commandName, props);
  });
});

client.login(token);