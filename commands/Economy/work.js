const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "work",
    description: 'Make some Money!',
    aliases : ['tryhard','work'],
    usage : '[amount of mana]',
    parameters: '<amount>'
};

module.exports.execute = async (client, message, args) => {
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);"
    );

    let stats = getStats.get(message.author.id, message.author.tag)

    function work(nbMana) {
        inv === new db('./database/stats.sqlite');
        workValue = Math.ceil(Math.random()*(8-2)+2 * nbMana)
        inv.prepare("INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);").run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money + workValue,
            mana : stats.mana - nbMana
        })
        message.channel.send(`You have used ${nbMana} mana to work and made ${workValue}$`)
    }

    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10
        }
        setStats.run(stats)
        message.channel.send(`You've just created your own profile!`)
        work(1)
    }

    if (message.author.id === admin && args[0] === 'cheat') {
        setStats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : stats.mana + Number(args[1])
        })
        return message.channel.send(`Here you go boss, here's your free ${args[1]} mana!`)
    }

    if (stats.mana>0) {
        if(!args[0]) { return work(1) }
        else if(args.length<=1) {
            if (stats.mana<=Number(args[0])) { work(stats.mana) }
            else if (stats.mana>Number(args[0])) { work(Number(args[0])) }
        }
    } else { return message.channel.send(`You've run out of mana!`) }

    if (!Number(args[0])) { return message.channel.send('You have to type a number!') }
};