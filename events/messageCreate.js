const {
    prefix,
    admin,
    devserver
} = require('../settings.json');

const { PermissionsBitField } = require("discord.js");
const db = require("better-sqlite3");
const Loader = require('../tools/Loader.js');

// Read DB
const logsDB = new db('./database/devtools/logs.sqlite');
const bansDB = new db('./database/devtools/banList.sqlite');
const serverListDB = new db('./database/devtools/serverList.sqlite');
const wordsDB = new db('./database/devtools/words.sqlite');

// Separate Words Categories
const badwordsList = wordsDB.prepare("SELECT * FROM words WHERE type = 'badword';").all();
const suicideTriggerList = wordsDB.prepare("SELECT * FROM words WHERE type = 'suicide';").all();

// DB Functions
const setServerInfos = serverListDB.prepare("INSERT OR REPLACE INTO serverlist (id, server, prefix, language) VALUES (@id, @server, @prefix, @language);");

module.exports = {
    once : false,
    execute(client, message) {
        if (message.author.bot) return;

        // Log in MD file
        Loader.logToMD(message, null)

        // Log in DB
        logsDB.prepare(`
            INSERT OR REPLACE INTO logs VALUES (
                @timestamp,
                @messageid,
                @channelid,
                @guildid,
                @authorid,
                @authorname,
                @content,
                @attachmenturl,
                @attachmenttype);
            `).run({
                timestamp: message.createdTimestamp,
                messageid: message.id,
                channelid: message.channel.id,
                guildid: message.guild === null ? null : message.guild.id,
                authorid: message.author.id,
                authorname: message.author.username,
                content: message.content,
                attachmenturl: message.attachments.size > 0 ? message.attachments.toJSON()[0].url : null,
                attachmenttype: message.attachments.size > 0 ? message.attachments.toJSON()[0].contentType : null
            });

        // Bot auto-response to specific Words
        for (const triggerWord of badwordsList) {
            if (message.content.toLowerCase().includes(triggerWord)) {
                message.reply(randomwords[Math.floor(Math.random() * randomwords.length)])
                break;
            }
        };

        for (const triggerWord of suicideTriggerList) {
            if (message.content.toLowerCase().includes(triggerWord)) {
                message.channel.send(`
                    If anyone is contemplating suicide, please do not do it.\n
                    It is not worth it, call this number instead from SOS Amitié: **09 72 39 40 50**.\n
                    Or if you are not in France you can call the international line here: **01 40 44 46 45**
                    or find your local line here: http://www.suicide.org/international-suicide-hotlines.html
                `)
                break;
            }
        }

        // Basic command line -> Testing if bot can response
        if (message.content.toLowerCase() === 'hey' && message.author.id === admin && message.guild.id === devserver) {
            return message.reply({ content: "I do work for now!", allowedMentions: { repliedUser: false }})
        };


        // If on server
        let getServerData;
        if (message.guild) {
            // Get Server Informations
            getServerData = serverListDB
                .prepare("SELECT * FROM serverlist WHERE id = ?;")
                .get(message.guild.id);

            if (!getServerData) {
                setServerInfos.run({
                    id: message.guild.id,
                    server: message.guild.name,
                    prefix: prefix,
                    language: "en"
                })
            }
        }

        // Trying making client tag support
        if (message.content.startsWith("<@" + client.user.id + ">")) {

            // Create args for client mention
            const args = message.content.slice(client.user.id.length+3).trim().split(/ +/);

            switch (args[0]) {
                case 'setprefix':
                    if (args[1] && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        // Create a function to set the prefix
                        setServerInfos.run({
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
                    break;

                case 'prefix':
                    if (args[1] === 'drop' && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        setServerInfos.run({
                            id: message.guild.id,
                            server: message.guild.name,
                            prefix: prefix,
                            language: "en"
                        });
                        return message.reply({
                            content: `The prefix has been dropped to \`${prefix}\``,
                            allowedMentions: { repliedUser: false }
                        });
                    }
                    break;

                default:
                    // Send prefix message to user
                    message.reply({
                        content: `My prefix is \`\`${getServerData?.prefix ?? prefix}\`\``,
                        allowedMentions: { repliedUser: false }
                    })
                    break;
            }
        }
        // Interact with user if chat input is command
        else if (message.content.startsWith(getServerData?.prefix ?? prefix)) {

            const getBanned = bansDB.prepare(`SELECT * FROM banlist WHERE id = ?;`).get(message.author.id);
            if (getBanned)
            return message.reply({
                content:    `You are banned from using this bot.\n
                            Reason: ${getBanned.reason}\n
                            If you think this is a mistake, please contact the bot owner.`,
                allowedMentions: { repliedUser: false }
            });

            const args = message.content.slice(getServerData?.prefix.length ?? prefix.length).trim().split(/ +/);
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

        // Log in Console
        Loader.logToConsole(`${message.author.tag} : ${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : '"' + message.content + '"'} on [${message.guild === null ? "DM" : "#"+message.channel.name + " : " + message.guild.name}]`);
    }
};