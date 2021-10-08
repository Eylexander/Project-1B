const Discord = require("discord.js");
const db = require("better-sqlite3");
// const sql = db('../../database/money.sqlite');
// const { getmoney, setmoney } = require('../../tools/dbUtils.js');

module.exports.help = {
    name : "money",
    description: 'See your amount of Money!',
    aliases : ['bal','balance'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    let money; 
    money = getmoney.get(message.author.id, message.author.tag)
    if (!money) {
        money = { id: `${message.author.id}-${message.author.tag}`, user: message.author.id, money: 0 }
    }
    message.channel.send(`You actually have ${money} money !`)
    money++;
    setmoney.run(money++)
};