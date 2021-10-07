const Discord = require('discord.js');
const client = new Discord.Client();
const moment = require('moment');
const fs = require('fs');
const { usize, ssize } = require('../events/ready.js')

// Defining Files
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
if (!fs.existsSync(folder)) { fs.mkdirSync(folder) };

const { badwords } = require('./word_libraries.json')

// Creating the writer
var stream = fs.createWriteStream(`${folder}/${file}.txt`, {'flags': 'w'});
stream.write(
`/* ==========================
==== Log file started at ====
== ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} ==
========================== */\r\n`
);
stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Client is ON | ${ssize} Servers | ${usize} Users \r\n`);

exports.onMessage = function (client, message) {
    if (message.author.bot) return;
    stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${message.author.username} (${message.author.id}) : "${message.content}" on [${message.channel.name} (${message.channel.id}) : ${message.guild.name} (${message.guild.id})] \r\n`);
    for (const trigger of badwords) {
        if (message.content.includes(trigger)) {
            message.reply("Oui")
            break
        }
    }
};