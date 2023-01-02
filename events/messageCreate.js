const { prefix, admin, devserver } = require('../settings.json');
const { badwords, randomwords, suicide } = require('../tools/word_libraries.json');
const fs = require('fs');

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

const db = require("better-sqlite3");
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };
const ban = new db('./database/blockedusers.sqlite');

// Creating the writer
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
if (!fs.existsSync('./logs/errors')) { fs.mkdirSync('./logs/errors') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
var stream = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'a'});

module.exports = (client, message) => {
    if (message.author.bot) return;

    stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] User ${message.author.username} (${message.author.id}) posted:
${message.guild === null ? `in DM (${message.author.id})` : "on [#" + message.channel.name + " ("+message.channel.id+") : " + message.guild.name + " ("+message.guild.id+")]"}\r\n`);
    stream.write(`\r\n\`\`\`\r\n${message.content}\r\n\`\`\`\r\n`);

    // Bot auto-response to specific Words
    for (const trigger of badwords) {
        if (message.content.toLowerCase().includes(trigger)) {
            message.reply(randomwords[Math.floor(Math.random()*randomwords.length)])
            break;
        }
    };
    for (const selfkill of suicide) {
        if (message.content.toLowerCase().includes(selfkill)) {
            message.channel.send('If anyone is contemplating suicide, please do not do it. It is not worth it, call this number instead: 1-800-273-8255. Or if you are not in the USA you can find your local line here: http://www.suicide.org/international-suicide-hotlines.html')
            break;
        }
    }
    
    // Basic command line -> Testing if bot can response
    if (message.content.toLowerCase() === 'hey' & message.author == admin && message.guild.id == devserver) {
        message.reply({ content: "I do work for now!", allowedMentions: { repliedUser: false }})
    };
    
    // Usefull command line -> Bot replies its own prefix
    if (message.mentions.users.first() === `<@${client.user.id}>`) {
        message.reply({ content: `My prefix is \`\`${prefix}\`\``, allowedMentions: { repliedUser: false }})
    };
    
    // Basic message listener for Console
    log(`${message.author.tag} : "${message.content}" on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

    if (message.content.startsWith(prefix)) {
        if(ban.prepare(`SELECT id FROM ban WHERE id = ?;`).get(message.author.id)) return message.author.send("You are banned from using this bot.");
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = client.commands.get(cmd)
        || client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

        // If the command has not been found, return.
        if (command == null) return console.log(`Command ${cmd} not found`);

        try {
            command.execute(client, message, args);
        } catch (error) {
            console.error(error);
            message.reply('Once again , a stupid error!')
        }
    }
};