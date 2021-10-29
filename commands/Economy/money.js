const Discord = require("discord.js");
const db = require("better-sqlite3");
const sql = new db('./database/stats.sqlite');
const { getmoney, setmoney } = require('../../tools/dbUtils.js');

module.exports.help = {
    name : "money",
    description: 'See your amount of Money!',
    aliases : ['bal','balance'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    const getmoney = sql.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");
    const setmoney = sql.prepare("INSERT OR REPLACE INTO stats (id, user, money) VALUES (@id, @user, @money);");

    let stats; 
    stats = getmoney.get(message.author.id, message.author.tag)
    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0 }
    }
    message.channel.send(`You actually have ${stats.money} money !`)
};