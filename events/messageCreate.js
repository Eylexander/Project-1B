const { prefix, admin, devserver } = require('../settings.json');
const fs = require('fs');
const { badwords, randomwords, suicide } = require('../tools/word_libraries.json');

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});
client.commands = new Collection();

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// const ssize = client.guilds.cache.size;
// const usize = eval(client.guilds.cache.map(g => g.memberCount).join(' + '));
const ssize = 0
const usize = 0

const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');

// Defining Files
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
if (!fs.existsSync(folder)) { fs.mkdirSync(folder) };

// Creating the writer
var stream = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'w'});
stream.write(`# Session file started at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}\r\n`);
stream.write(`## [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Client is ON | ${ssize} Servers | ${usize} Users \r\n`);
stream.write('--- \r\n');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(message) {
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
        // if (message.mentions.users.first() === `<@${ClientUser.id}>`) {
        //     message.reply({ content: `My prefix is \`\`${prefix}\`\``, allowedMentions: { repliedUser: false }})
        // };
    
        // Basic message listener for Console
        log(`${message.author.tag} : "${message.content}" on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);

        if (message.content.startsWith(prefix)) {
            if(ban.prepare(`SELECT id FROM ban WHERE id = ?;`).get(message.author.id)) return message.author.send("You are banned from using this bot.");
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();

            // Reading all Command Folders
            const path = require('node:path');
            const commandFoldersPath = path.join(__dirname, '../commands');
            const commandFolders = fs.readdirSync(commandFoldersPath);
            for (const folder of commandFolders) {
                const commandFilesPath = path.join(__dirname, '../commands/', folder);
                const commandFiles = fs.readdirSync(commandFilesPath).filter(file => file.endsWith('.js'));
                for (const file of commandFiles) {
                    const commandPath = path.join(__dirname, '../commands', folder, file);
                    const command = require(commandPath);
                    client.commands.set(command.help.name, command);
                }
            }

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
    },
}