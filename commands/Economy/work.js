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
    const setstats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);"
    );

    let stats = getstats.get(message.author.id, message.author.tag)
    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 0 
        }
        message.channel.send('You just created your own profile!')
    }

    if (args[0] === 'mana') {
        setstats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : stats.mana + Number(args[1])
        })
        message.channel.send(`You cheated and added yourself ${Number(args[1])} mana!`)
    } else if (!args[0]) {
        return message.channel.send('You can\'t work with letters')
    } else {
        const amountmana = Number(args[0])
        const randone = Math.ceil(Math.random() * 30 * amountmana + amountmana * (Math.random() * 10))
        if (stats.mana >= amountmana > 0) {
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : `${(stats.money + randone) < (amountmana * 3) ? (stats.money + randone * 1.5) : stats.money + randone}`,
                mana : stats.mana - amountmana
            })
            message.channel.send(`You used ${amountmana} mana to work and made ${randone}$`)
        } else if (stats.mana <= 0) {
            return message.channel.send('You already used all your mana!')
        } else if (amountmana > stats.mana >= 0) {
            const allmana = amountmana - (amountmana - stats.mana)
            const randall = Math.floor(Math.random()*10) * allmana
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : stats.money + randall,
                mana : stats.mana - amountmana
            })
            message.channel.send(`You used all of your mana to work and made ${randall}$`)
        } else {
            message.channel.send('There was a problem.')
        }
    }
};