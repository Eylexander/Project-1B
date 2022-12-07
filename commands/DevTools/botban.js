const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');
const { admin } = require('../../settings.json');

module.exports.help = {
    name : "botban",
    description: 'Permaban users from using the bot',
    aliases : ['permaban','blockuser'],
    usage : '[user]'
};

module.exports.execute = async (client, message, args) => {
    const getBannedUserById = ban.prepare("SELECT id FROM ban WHERE id = ?;");
    const getListBanned = ban.prepare("SELECT id, user FROM ban;").all();

    if (!message.author.id === admin) return;

    if (!args[0]) {
        return message.channel.send("You must provide someone's ID or try a few parameters.")
        // send help message
    }

    if (['list', 'count'].includes(args[0])) {
        if (getListBanned.length == 0) {
            message.channel.send("There is no banned users.")
        } else {
            let i;
            for (const data of getListBanned) {
                message.channel.send(`Banned user: ${data.user} (${data.id})`)
            }
            return message.channel.send(`There are ${getListBanned.length} users banned.`)
        }
        
    } else {
        if (args[1].match(/<@!?([0-9]*)>/)) {
            const userMention = args[1].match(/<@!?([0-9]*)>/);
            const user = client.users.cache.get(userMention[1]);

            if (['add', 'ban'].includes(args[0])) {
                if (!getBannedUserById.get(user.id)) {
                    ban.prepare(`INSERT INTO ban (id, user) VALUES (${user.id}, '${user.username}');`).run();
                    return message.channel.send(`Banned user ${user.username} (${user.id})`)
                } else {
                    return message.channel.send(`User ${user.username} (${user.id}) is already banned.`)
                }
        
            } else if (['remove', 'unban'].includes(args[0])) {
                if (getBannedUserById.get(user.id)) {
                    ban.prepare(`DELETE FROM ban WHERE id = ${user.id}`).run();
                    return message.channel.send(`Unbanned user ${user.username} (${user.id})`)
                } else {
                    return message.channel.send(`User ${user.username} (${user.id}) is not banned.`)
                }
            }
        } else {
            if (args[1].match(/^([0-9]*$)/)) {
                const userId = args[1].match(/^([0-9]*$)/);
                const userObject = await client.users.fetch(userId[1]);
    
                if (['add', 'ban'].includes(args[0])) {
                    if (!getBannedUserById.get(userObject.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${userObject.id}, '${userObject.username}');`).run();
                        return message.channel.send(`Banned user ${userObject.id} (${userObject.username})`)
                    } else {
                        return message.channel.send(`User ${userObject.username} (${userObject.id}) is already banned.`)
                    }
            
                } else if (['remove', 'unban'].includes(args[0])) {
                    if (getBannedUserById.get(userObject.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${userObject.id}`).run();
                        return message.channel.send(`Unbanned user ${userObject.id} (${userObject.username})`)
                    } else {
                        return message.channel.send(`User ${userObject.username} (${userObject.id}) is not banned.`)
                    }
                }
            } else {
                return message.channel.send('You have to tag someone !');
            }
        }
            
    }
};

