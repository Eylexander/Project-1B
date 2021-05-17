const Discord = require('discord.js');
const settings = require('./settings.json');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
const client = new Discord.Client();
require('./tools/EventLoader.js')(client);

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss`))

const prefix = settings.prefix;

const log = message => {
  console.log(`[${moment().format('MM-DD HH:mm:ss')}] ${message}`);
};

fs.readdir('./command/', (err, files) => {
    if (err) console.log(err);
    let jsfiles = files.filter(file => file.split(".").pop() === "js");
    if (jsfiles.length <= 0){
      console.log(chalk.bgRed('There is no files in ./command/'))
      return;
    };
    log(`Loading a total of ${files.length} commands.`);
    jsfiles.forEach(file => {
      log(`Loading Command: ${file}`);
    });
});

client.on('message', message => {
  if(message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  if(cmd === `${prefix}test`){
    message.reply("ça à l'air de marcher m'sieur");
  }

  if(cmd === `${prefix}hostinfo`){
    message.reply("ça à l'air de marcher m'sieur");
  }

  log(`${message.author.tag}` + " said: \"" + `${message.content}` +"\" on: " + (message.channel.name));
});

// Debug command
client.on('message', msg => {
  if (msg.content === 'hey') {
    msg.reply("I do work for now!");
  }
});

client.on('message', msg => {
  if (msg.author.bot) return;
    if (msg.content.startsWith('<@')) {
      let targetMember = msg.mentions.members.first();
      msg.reply("Hush, don't bother " + `${targetMember.user.username}`);
    }
    if (msg.content === `${prefix}name`) {
      msg.channel.send(msg.guild.name);
    }
    if (msg.content === `${prefix}online`) {
      msg.channel.send(`Total Members : ${msg.guild.createdAt}`);
    }
});

client.login(settings.token);