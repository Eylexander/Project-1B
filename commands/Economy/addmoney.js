const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "addmoney",
    description: 'Make some Money!',
    aliases : ['addbal','morebal','work'],
    usage : '[amount]'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0] === Number) return message.channel.send('U can\'t do that')
    const getmoney = inv.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");
    const setmoney = inv.prepare("INSERT OR REPLACE INTO stats (id, user, money) VALUES (@id, @user, @money);");

    let stats = getmoney.get(message.author.id, message.author.tag)
    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0 }
    }
    setmoney.run({
        id : message.author.id,
        user : message.author.tag,
        money : stats.money + Number(args[0])
    })
    message.channel.send(`You made ${args[0]}$ !`)
};