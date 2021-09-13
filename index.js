const Discord = require('discord.js');
const client = new Discord.Client();
const {token, prefix} = require('./settings.json');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
client.commands = new Discord.Collection();

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

//Log system
const { onMessage } = require('./tools/log_boot.js')
client.on('message', onMessage.bind(null, client))

// Debug command
client.on('message', message => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === 'hey') {
    message.reply("I do work for now!");
  };
  if (message.content.toLowerCase() === "oui") {
    message.reply("non")
  };

  if(message.content.slice().trim().split(/ +/)[0] === message.mentions.has(client.user)) {
    message.channel.send(`My prefix is \`\`${prefix}\`\``)
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
    let commandName = props.help.name;
    log(`Loading Command: ${commandName}`);
    client.commands.set(commandName, props);
  });
});

// Bad word reading system
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

client.login(token);