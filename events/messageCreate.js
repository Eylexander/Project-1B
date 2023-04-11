const { prefix, admin, devserver } = require('../settings.json');
const { badwords, randomwords, suicide } = require('../tools/word_libraries.json');
const { PermissionsBitField } = require("discord.js")
const fs = require('fs');

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Read the bans
const db = require("better-sqlite3");
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };
if (!fs.existsSync('./database/devtools')) { fs.mkdirSync('./database/devtools') };
const ban = new db('./database/devtools/bannedusers.sqlite');

// Read the server settings
const ser = new db('./database/devtools/server.sqlite');

// Creating the writer
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
if (!fs.existsSync('./logs/errors')) { fs.mkdirSync('./logs/errors') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
var stream = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'a'});
const logger = new db('./database/devtools/logs.sqlite');

module.exports = (client, message) => {
    if (message.author.bot) return;

    // Log in MD file
    stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] User ${message.author.username} (${message.author.id}) posted:
${message.guild === null ? `in DM (${message.author.id})` : "on [#" + message.channel.name + " ("+message.channel.id+") : " + message.guild.name + " ("+message.guild.id+")]"}\r\n`);
    stream.write(`\r\n\`\`\`\r\n${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : message.content}\r\n\`\`\`\r\n`);

    // Log in DB
    logger.prepare(`
        INSERT OR REPLACE INTO logs VALUES (
            @year,
            @month,
            @day,
            @hour,
            @minute,
            @second,
            @millisecond,
            @messageid,
            @channelid,
            @guildid,
            @authorid,
            @authorname,
            @content,
            @hasattachments,
            @attachmenturl,
            @attachmenttype);
        `).run({
            year: moment(message.createdTimestamp).format('YYYY'),
            month: moment(message.createdTimestamp).format('MM'),
            day: moment(message.createdTimestamp).format('DD'),
            hour: moment(message.createdTimestamp).format('HH'),
            minute: moment(message.createdTimestamp).format('mm'),
            second: moment(message.createdTimestamp).format('ss'),
            millisecond: moment(message.createdTimestamp).format('SSS'),
            messageid: message.id,
            channelid: message.channel.id,
            guildid: message.guild === null ? null : message.guild.id,
            authorid: message.author.id,
            authorname: message.author.username,
            content: message.content,
            hasattachments: message.attachments.size > 0 ? 1 : 0,
            attachmenturl: message.attachments.size > 0 ? message.attachments.toJSON()[0].url : null,
            attachmenttype: message.attachments.size > 0 ? message.attachments.toJSON()[0].contentType : null
        });

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
    if (message.content.toLowerCase() === 'hey' && message.author.id === admin && message.guild.id === devserver) {
        return message.reply({ content: "I do work for now!", allowedMentions: { repliedUser: false }})
    };

    // Get the prefix
    const getPrefix = ser.prepare("SELECT * FROM server WHERE id = ?;").get(message.guild.id);

    // Trying making client tag support
    if (message.content.startsWith("<@" + client.user.id + ">")) {

        // Create args for client mention
        const args = message.content.slice(client.user.id.length+3).trim().split(/ +/);

        if (args[0] === 'setprefix') {
            if (args[1] && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                // Create a function to set the prefix
                ser.prepare(
                    "INSERT OR REPLACE INTO server (id, server, prefix, language) VALUES (@id, @server, @prefix, @language);"
                ).run({
                    id: message.guild.id,
                    server: message.guild.name,
                    prefix: args[1],
                    language: "en"
                });
            
                // Send a message to the user
                message.reply({
                    content: `The prefix has been set to \`${args[1]}\``,
                    allowedMentions: { repliedUser: false }
                });
            }
        } else if (args[0] === 'prefix') {
            if (args[1] === 'drop' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                ser.prepare(
                    "INSERT OR REPLACE INTO server (id, server, prefix, language) VALUES (@id, @server, @prefix, @language);"
                ).run({
                    id: message.guild.id,
                    server: message.guild.name,
                    prefix: prefix,
                    language: "en"
                });
                return message.reply({
                    content: `The prefix has been dropped to \`${prefix}\``,
                    allowedMentions: { repliedUser: false }
                });
            } else {
                // Send prefix message to user
                message.reply({
                    content: `My prefix is \`\`${getPrefix?.prefix ?? prefix}\`\``,
                    allowedMentions: { repliedUser: false }
                })
            }
        } else {
            // Send prefix message to user
            message.reply({
                content: `My prefix is \`\`${getPrefix?.prefix ?? prefix}\`\``,
                allowedMentions: { repliedUser: false }
            })
        }
    }

    // Basic message listener for Console
    log(`${message.author.tag} : ${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : '"' + message.content + '"'} on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

    // Interact with user if chat input is command
    if (message.content.startsWith(getPrefix?.prefix ?? prefix)) {
        const getBanned = ban.prepare(`SELECT * FROM bannedusers WHERE id = ?;`).get(message.author.id);
        if (getBanned) return message.author.send("You are banned from using this bot. \nReason : \`${getBanned.reason}\`\nIf you think this is a mistake, please contact the bot owner.");

        const args = message.content.slice(getPrefix?.prefix.length ?? prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = client.commands.get(cmd)
        || client.commands.find(cmdObj => cmdObj.help.aliases && cmdObj.help.aliases.includes(cmd));

        // If the command has not been found, return.
        if (command == null) return;

        try {
            command.execute(client, message, args);
        } catch (error) {
            log(error)
            console.error(error);
            // Send error message to admin user
            message.admin.send(
                `An error occured while executing the command \`${command.help.name}\` : \n\`\`\`${error}\`\`\``
            )
        }
    }
};