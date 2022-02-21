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
    const getban = ban.prepare("SELECT * FROM ban WHERE id = ?;");
    const addban = ban.prepare(
        "INSERT OR REPLACE INTO ban (id, user) VALUES (@id, @user);"
    );

    let blockedUsers = getban.get()

    if (!message.author.id === admin) return;
    if (!args[0]) {
        return message.channel.send("You must provide someone's ID.")
    } else if (['list', 'count'].includes(args[0])) {
        const desc = 
        message.channel.send(`${getban.id}, ${getban.user}\n`)
    }
};