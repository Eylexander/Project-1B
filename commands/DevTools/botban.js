const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');
const { admin } = require('../../settings.json');

module.exports.help = {
    name : "botban",
    description: 'Permaban users from using the bot',
    aliases : ['permaban','blockuser'],
    usage : '[user]',
    parameters: '<tag>'
};

module.exports.execute = async (client, message, args) => {
    const getBannedUserById = ban.prepare("SELECT * FROM ban WHERE id = ?;");
    const getListBanned = ban.prepare("SELECT id, user FROM ban;").all();

    if (!message.author.id === admin) return;

    switch (args[0]) {
        case 'list':
        case 'count':
            if (getListBanned.length == 0) {
                message.channel.send("There is no banned users.")
            } else {
                for (const data of getListBanned) {
                    message.channel.send(`Banned user: ${data.user} (${data.id})`)
                }
                message.channel.send(`There are ${getListBanned.length} users banned.`)
            }
            break;
        case 'add':
        case 'ban':
            if (!args[1]) {
                message.channel.send("Please specify a user to ban.")
            } else {
                if (message.mentions.users.first()) {
                    const getMentionTag = message.mentions.users.first()

                    if (!getBannedUserById.get(getMentionTag.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${getMentionTag.id}, '${getMentionTag.username}');`).run();
                        return message.channel.send(`Banned user ${getMentionTag.username} (${getMentionTag.id})`)
                    } else {
                        return message.channel.send(`User ${getMentionTag.username} (${getMentionTag.id}) is already banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        if (!getBannedUserById.get(getUserObjectId.id)) {
                            ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectId.id}, '${getUserObjectId.user}');`).run();
                            return message.channel.send(`Banned user ${getUserObjectId.id} (${getUserObjectId.user})`)
                        } else {
                            return message.channel.send(`User ${getUserObjectId.user} (${getUserObjectId.id}) is already banned.`)
                        }
                    }
                }
            }
        case 'remove':
        case 'unban':
            if (!args[1]) {
                message.channel.send("Please specify a user to unban.")
            } else {
                if (message.mentions.users.first()) {
                    const getMentionTag = message.mentions.users.first();

                    if (getBannedUserById.get(getMentionTag.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${getMentionTag.id}`).run();
                        return message.channel.send(`Unbanned user ${getMentionTag.username} (${getMentionTag.id})`)
                    } else {
                        return message.channel.send(`User ${getMentionTag.username} (${getMentionTag.id}) is not banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        if (getBannedUserById.get(getUserObjectId.id)) {
                            ban.prepare(`DELETE FROM ban WHERE id = ${getUserObjectId.id}`).run();
                            return message.channel.send(`Unbanned user ${getUserObjectId.id} (${getUserObjectId.user})`)
                        } else {
                            return message.channel.send(`User ${getUserObjectId.user} (${getUserObjectId.id}) is not banned.`)
                        }
                    }
                }
            }
        default:
            message.channel.send("You must provide someone's ID or try a few parameters.")
            // send help message
            break;
    }
};