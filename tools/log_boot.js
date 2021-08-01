const Discord = require('discord.js');
const client = new Discord.Client();
const moment = require('moment');
const fs = require('fs');
const {ssize, usize} = require ('../events/ready.js');

// var name = `../logs/logs.txt`;

var stream = fs.createWriteStream('../logs/logs.txt', {'flags': 'w'});
stream.write(
`/* ==========================
==== Log file started at ====
== ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} ==
========================== */\r\n`
);
stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Bot is ON | ${ssize} Servers | ${usize} Users \r\n`);

module.exports = (client, message) => {
    // stream.once('open', function(fd) {
    if (message.author.bot) return;
    stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${message.author.username} (${message.author.id}) : "${message.content}" on [${message.channel.name} (${message.channel.id}) : ${message.guild.name} (${message.guild.id})] \r\n`);
    // });
};