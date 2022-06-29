const Discord = require('discord.js');
const client = new Discord.Client();
const { prefix, admin } = require('../settings.json')
const fs = require('fs');
const { usize, ssize } = require('../events/ready.js')
const { badwords, randomwords, suicide } = require('./word_libraries.json')

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Defining Files
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
if (!fs.existsSync(folder)) { fs.mkdirSync(folder) };

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
    stream.write(`[${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] ${message.author.username} (${message.author.id}) : "${message.content}" on [${message.channel.name === null ? "DM" : message.channel.name} (${message.channel.id === null ? "DM" : "DM"}) : ${message.guild.name === null ? "DM" : message.guild.name} (${message.guild.id === null ? "DM" : "DM"})] \r\n`);
    
    // Bot auto-response to specific Words
    for (const trigger of badwords) {
        if (message.content.toLowerCase().includes(trigger)) {
            message.reply(randomwords[Math.floor(Math.random()*randomwords.length)])
            break
        }
    };
    for (const selfkill of suicide) {
        if (message.content.toLowerCase().includes(selfkill)) {
            message.channel.send('If anyone is contemplating suicide, please do not do it. It is not worth it, call this number instead: 1-800-273-8255. Or if you are not in the USA you can find your local line here: http://www.suicide.org/international-suicide-hotlines.html')
            break
        }
    }

    // Basic command line -> Testing if bot can response
    if (message.content.toLowerCase() === 'hey' & message.author == admin) {
        message.reply("I do work for now!");
    };

    // Usefull command line -> Bot replies its own prefix
    if (message.content === `<@!${client.user.id}>`) {
        message.channel.send(`My prefix is \`\`${prefix}\`\``)
    };

    // Basic message listener for Console
    log(`${message.author.tag} : "${message.content}" on [${message.channel.name} : ${message.guild.name === null ? "DM" : message.guild.name}]`);
};