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

// Debug command
client.on('message', message => {
  if (message.content === 'hey') {
    message.reply("I do work for now!");
  };
});

//Reading all Command Files
fs.readdir('./command/', (err, file) => {
  if (err) return log(err);
  if (file.lenght <= 0) {return log(chalk.bgRed('There is no files in ./command/'))};
  log(`Loading a total of ${file.lenght} commands.`);
  file.forEach((file) => {
    if (!file.endsWith('.js')) return;
    let props = require(`./command/${file}`);
    let commandName = file.split(".")[0];
    log(`Loading Command: ${commandName}`);
    client.commands.set(commandName, props);
  });
});

// Setup Bot => Command system
client.on('message', async message => {
  if(message.author.bot) return;
  if(!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  let command = client.commands.get(cmd);
  if (!command) command = client.commands.get(cmd.aliases);

  if (command) command.execute(client, message, args);

  // const command = 
  //   client.commands.get(cmd) ||
  //   client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(cmd));
});

client.login(token);