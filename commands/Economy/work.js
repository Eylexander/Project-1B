const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');
const { admin } = require('../../settings.json');

module.exports.help = {
    name : "work",
    description: 'Make some Money!',
    aliases : ['tryhard','work'],
    usage : '[amount of mana]',
    parameters: '<amount>'
};

module.exports.execute = async (client, message, args) => {
    const stats = inv.prepare("SELECT * FROM stats WHERE id = ?;").get(message.author.id);
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, business, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @business, @level, @xp);"
    );

    function work(nbMana) {
        inv === new db('./database/stats.sqlite');
        const getLevelData = inv.prepare("SELECT level FROM stats WHERE id = ?;").get(message.author.id).level;
        workValue = Math.ceil(Math.random()*(15*getLevelData-2*getLevelData)+3*getLevelData * nbMana)
        inv.prepare("INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, business, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @business, @level, @xp);").run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money + workValue,
            mana : stats.mana - nbMana,
            maxmana : stats.maxmana,
            business : stats.business,
            level : stats.level,
            xp : Math.floor(stats.xp + workValue/4),
        })
        message.channel.send(`You have used ${nbMana} mana to work and made ${workValue}$`)
    }

    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10,
            maxmana : 150,
            business : 'none',
            level : 1,
            xp : 0,
        }
        setStats.run(stats)
        message.channel.send(`You've just created your own profile!`)
        work(1)
    }

    if (stats.xp >= stats.level**2*100) {
        setStats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : stats.mana,
            maxmana : stats.maxmana + 10,
            business : stats.business,
            level : stats.level + 1,
            xp : stats.xp - stats.level*100,
        })
        message.channel.send(`You've just leveled up! You're now level ${stats.level+1}!`)
    }

    if (message.author.id === admin && args[0] === 'cheat') {
        setStats.run({
            id : message.author.id,
            user : message.author.tag,
            money : stats.money,
            mana : stats.mana + Number(args[1]),
            maxmana : stats.maxmana,
            business : stats.business,
            level : stats.level,
            xp : stats.xp,
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