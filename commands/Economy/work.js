const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "work",
    description: 'Make some Money!',
    aliases : ['tryhard','work'],
    usage : '[amount of mana]'
};

module.exports.execute = async (client, message, args) => {
    const getstats = inv.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");
    const setstats = inv.prepare("INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);");

    let stats = getstats.get(message.author.id, message.author.tag)
    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 0 
        }
    }

    if (args[0] === 'mana') {
        setstats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : stats.mana + 50
        })
        message.channel.send('You cheated and added yourself 50 mana!')
    }

    if (!args[0]) {
        return message.channel.send('You can\'t work with letters')
    } else {
        const amountmana = Number(args[0])
        const randone = Math.floor(Math.random()*10) * amountmana
        if (stats.mana >= amountmana > 0) {
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : stats.money + randone,
                mana : stats.mana - amountmana
            })
            message.channel.send(`You used ${amountmana} mana to work and made ${randone}$`)
        } else if (amountmana > stats.mana) {
            const randone = Math.floor(Math.random()*10) * stats.mana
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : stats.money + randone,
                mana : stats.mana - amountmana
            })
            message.channel.send(`You used all of your mana to work and made ${randone}$`)
        }
    }
};