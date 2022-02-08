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
        setstats.run(stats)
    }

    if (args[0] === 'mana') {
        let nb1 = Number(args[1])
        setstats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : (nb1 === null || nb1 === NaN ? stats.mana+10 : stats.mana + nb1)
        })
        message.channel.send(`You cheated and added yourself ${nb1 === null || nb1 === NaN ? '10' : nb1} mana!`)
    }
    else if (!args[0]) {
        const random1 = Math.ceil(Math.random() * 30 + (Math.random() * 10))
        if (stats.mana > 0) {
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : `${(stats.money + random1) < 3 ? (stats.money + random1 * 1.5) : stats.money + random1}`,
                mana : stats.mana - 1
            })
            message.channel.send(`You used 1 mana to work and made ${random1}$`)
        }
    }
    else {
        const amountmana = Number(args[0])
        const randone = Math.ceil(Math.random() * 30 * amountmana + amountmana * (Math.random() * 10))
        if (stats.mana >= amountmana > 0) {
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : `${(stats.money + randone) < (amountmana * 3) ? (stats.money + randone * 1.5) : stats.money + randone}`,
                mana : stats.mana - amountmana
            })
            message.channel.send(`You used ${amountmana} mana to work and made ${(stats.money + randone) < (amountmana * 3) ? (stats.money + randone * 1.5) : stats.money + randone}$`)
        } else if (stats.mana <= 0) {
            return message.channel.send('You already used all your mana!')
        } else if (amountmana > stats.mana >= 0) {
            const allmana = amountmana - (amountmana - stats.mana)
            const randall = Math.ceil(Math.random() * 30 * allmana + allmana * (Math.random() * 10))
            setstats.run({
                id : message.author.id,
                user : message.author.tag,
                money : `${(stats.money + randall) < (allmana * 3) ? (stats.money + randall * 1.5) : stats.money + randall}`,
                mana : stats.mana - allmana
            })
            message.channel.send(`You used all of your mana to work and made ${(stats.money + randall) < (allmana * 3) ? (stats.money + randall * 1.5) : stats.money + randall}$`)
        } else {
            message.channel.send('There was a problem.')
        }
    }
};