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
  if (message.content.toLowerCase() === 'hey') {
    message.reply("I do work for now!");
  };
  if (message.content.toLowerCase() === "oui") {
    message.reply("non")
  };
  log(`${message.author.tag} : "${message.content}" on [${message.channel.name} : ${message.guild.name}]`);
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

client.on('message', message => {
  // const regex = new RegExp(`(\\b|\\d)(${badwords.join('|')})(\\b\\d)`, 'i');
  // if (regex.test(message.content)) {
  //   message.reply('Please do not say bad words.').then(message => {setTimeout(() => {message.delete()}, 2500)});
  //   message.delete();
  // }
  // if (message.content.toLowerCase().includes(badwords[i].toLowerCase())) foundInText = true;
  // if (foundInText) {
  //   try {
  //     message.delete();
  //     message.reply("cé pa bi1 les insultes").then(message => {setTimeout(() => {message.delete()}, 2500)});
  //   } catch (error) {
  //     console.log(error)
  //   } 
  // }
  // if (badwords.some(word => message.toString().toLowerCase().includes(word))) {
  //   message.delete().catch(e => console.error("Couldn't delete message.")); 
  //   message.reply(`Please do not swear.`);
  // };
});


//Log system
var stream = fs.createWriteStream('./tools/logs.txt', {'flags': 'a'});
stream.write(
`/* ==========================
==== Log file started at ====
== ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} ==
========================== */\r\n`
);
stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Bot is ON | ${client.guilds.cache.size} Servers | ${client.users.cache.size} Users \r\n`);

client.on('message', message => {
  // stream.once('open', function(fd) {
    if (message.author.bot) return;
    stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${message.author.username} (${message.author.id}) : "${message.content}" on [${message.channel.name} (${message.channel.id}) : ${message.guild.name} (${message.guild.id})] \r\n`);
  // });
});

client.login(token);