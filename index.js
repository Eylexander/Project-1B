const Discord = require('discord.js');
const client = new Discord.Client();
const {token, prefix} = require('./settings.json');
const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs');
client.commands = new Discord.Collection();
require('./tools/EventLoader.js')(client);

console.log(chalk.grey(`Time Format : MM-DD HH:mm:ss.SSS`))
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

//Reading all Command Files
const commandFiles = fs.readdirSync('./command').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    // if (file.length <= 0){
    //   return console.log(chalk.bgRed('There is no files in ./command/'));
    // };
    log(`Loading a total of ${file.length} commands.`);
    const command = require(`./command/${file}`);
    client.commands.set(command.name, command);
    // file.log(file => {
    //   log(`Loading Command: ${file}`);
    // });
};

// Debug command
client.on('message', msg => {
  if (msg.content === 'hey') {
    msg.reply("I do work for now!");
  }
});

client.on('message', message => {
  if(message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  let targetMember = message.mentions.users.first();

  if (!client.commands.has(command)) return;
  try {
    client.commands.get(command).execute(client, message, args);
  } catch (error) {
    console.error(error);
    log(chalk.bgRed("Command not working !"));
    message.channel.send("Command not working !");
  };

  if(command === 'test') {
    message.reply("ça à l'air de marcher m'sieur");
    log(`Command send: ${cmd}\nArgs: ${args}`);
    if (args[0] === 'lucie') {
      return message.reply("Zi bélouved");
    };
  } else if(command === 'hostinfo'){
    message.reply("ça à l'air de marcher m'sieur");
  } else if(command === 'ban') {
    let targetMember = message.mentions.users.first();
    message.reply(`T'es sûr de ban le fréro ${targetMember.username} ?`)
  }

  log(`${message.author.tag}` + " said: \"" + `${message.content}` +"\" on: " + (message.channel.name));
});

client.login(token);