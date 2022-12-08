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
    const getBannedUserById = ban.prepare("SELECT id FROM ban WHERE id = ?;");
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
                if (args[1].match(/<@!?([0-9]*)>/)) {
                    const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
                    const getUserObjectTag = client.users.cache.get(getMentionTag[1])

                    if (!getBannedUserById.get(getUserObjectTag.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectTag.id}, '${getUserObjectTag.username}');`).run();
                        return message.channel.send(`Banned user ${getUserObjectTag.username} (${getUserObjectTag.id})`)
                    } else {
                        return message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) is already banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = client.users.cache.get(getMentionId[1])

                        if (!getBannedUserById.get(getUserObjectId.id)) {
                            ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectId.id}, '${getUserObjectId.username}');`).run();
                            return message.channel.send(`Banned user ${getUserObjectId.id} (${getUserObjectId.username})`)
                        } else {
                            return message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) is already banned.`)
                        }
                    }
                }
            }
        case 'remove':
        case 'unban':
            if (!args[1]) {
                message.channel.send("Please specify a user to unban.")
            } else {
                if (args[1].match(/<@!?([0-9]*)>/)) {
                    const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
                    const getUserObjectTag = client.users.cache.get(getMentionTag[1])

                    if (getBannedUserById.get(getUserObjectTag.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${getUserObjectTag.id}`).run();
                        return message.channel.send(`Unbanned user ${getUserObjectTag.username} (${getUserObjectTag.id})`)
                    } else {
                        return message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) is not banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = client.users.cache.get(getMentionId[1])

                        if (getBannedUserById.get(getUserObjectId.id)) {
                            ban.prepare(`DELETE FROM ban WHERE id = ${getUserObjectId.id}`).run();
                            return message.channel.send(`Unbanned user ${getUserObjectId.id} (${getUserObjectId.username})`)
                        } else {
                            return message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) is not banned.`)
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