const { prefix, admin, devserver } = require('../settings.json');
const { badwords, randomwords, suicide } = require('../tools/word_libraries.json');
const fs = require('fs');

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

const db = require("better-sqlite3");
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };
if (!fs.existsSync('./database/devtools')) { fs.mkdirSync('./database/devtools') };
const ban = new db('./database/devtools/bannedusers.sqlite');

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
    stream.write(`\r\n\`\`\`\r\n${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : message.content}\r\n\`\`\`\r\n`);

    // Bot auto-response to specific Words
    for (const trigger of badwords) {
        if (message.content.toLowerCase().includes(trigger)) {
            message.reply(randomwords[Math.floor(Math.random()*randomwords.length)])
            break;
        }
    };
    for (const selfkill of suicide) {
        if (message.content.toLowerCase().includes(selfkill)) {
            message.channel.send('If anyone is contemplating suicide, please do not do it.\nIt is not worth it, call this number instead from SOS Amitié: **09 72 39 40 50**.\nOr if you are not in France you can call the international line here: **01 40 44 46 45** or find your local line here: http://www.suicide.org/international-suicide-hotlines.html')
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
    log(`${message.author.tag} : ${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : '"' + message.content + '"'} on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

    // Interact with user if chat input is command
    if (message.content.startsWith(prefix)) {
        const getBanned = ban.prepare(`SELECT * FROM bannedusers WHERE id = ?;`).get(message.author.id);
        if (getBanned) return message.author.send("You are banned from using this bot. \nReason : \`${getBanned.reason}\`\nIf you think this is a mistake, please contact the bot owner.");

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = client.commands.get(cmd)
        || client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

        // If the command has not been found, return.
        if (command == null) return;

        try {
            command.execute(client, message, args);
        } catch (error) {
            console.error(error);
            message.reply('Once again , a stupid error!')
        }
    }
};