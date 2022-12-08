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
            switch (args[1]) {
                case /<@!?([0-9]*)>/.test(args[1]):
                    const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
                    const getUserObjectTag = client.users.cache.get(getMentionTag[1])

                    if (!getBannedUserById.get(user.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectTag.id}, '${getUserObjectTag.username}');`).run();
                        message.channel.send(`Banned user ${getUserObjectTag.username} (${getUserObjectTag.id})`)
                    } else {
                        message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) is already banned.`)
                    }
                    break;
                case /^([0-9]*$)/.test(args[1]):
                    const getMentionId = args[1].match(/([0-9]*)/)
                    const getUserObjectId = client.users.cache.get(getMentionId[1])

                    if (!getBannedUserById.get(userObject.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectId.id}, '${getUserObjectId.username}');`).run();
                        message.channel.send(`Banned user ${getUserObjectId.id} (${getUserObjectId.username})`)
                    } else {
                        message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) is already banned.`)
                    }
                    break;
                default:
                    message.channel.send('You have to tag someone !');
                    break;
            }
            break;
        case 'remove':
        case 'unban':
            switch (args[1]) {
                case /<@!?([0-9]*)>/.test(args[1]):
                    const userMention = args[1].match(/<@!?([0-9]*)>/);
                    const user = client.users.cache.get(userMention[1]);

                    if (getBannedUserById.get(user.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${user.id}`).run();
                        return message.channel.send(`Unbanned user ${user.username} (${user.id})`)
                    } else {
                        return message.channel.send(`User ${user.username} (${user.id}) is not banned.`)
                    }
                    break;
                case /^([0-9]*$)/.test(args[1]):
                    const userId = args[1].match(/^([0-9]*$)/);
                    const userObject = await client.users.fetch(userId[1]);

                    if (getBannedUserById.get(userObject.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${userObject.id}`).run();
                        return message.channel.send(`Unbanned user ${userObject.id} (${userObject.username})`)
                    } else {
                        return message.channel.send(`User ${userObject.username} (${userObject.id}) is not banned.`)
                    }
                    break;
                default:
                    message.channel.send('You have to tag someone !');
                    break;
            }
            break;
        default:
            message.channel.send("You must provide someone's ID or try a few parameters.")
            // send help message
            break;
    }
};