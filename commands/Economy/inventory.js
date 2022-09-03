const Discord = require("discord.js");
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "inventory",
    description: 'See your Inventory!',
    aliases : ['me','balance','inv','money'],
    usage : '< none | player >'
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
            mana : 10
        }
        setstats.run(stats)
        message.channel.send(`You've just created your own profile!`)
    }

    const inventory = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setTitle(message.author.username + '\'s Inventory')
        .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
        .addFields(
            { name: "Money", value: `${stats.money} $`, inline: true },
            { name: 'Energy', value: `${stats.mana} mana / 150`, inline: true}
        )
        .setTimestamp()
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    if (!args[0]) {
        return message.channel.send(inventory)
    } else {
        const userMention = args[0].match(/<@!?([0-9]*)>/)
        if (userMention == null) {
            return message.channel.send(inventory)
        } else {
            const usercalled = client.users.cache.get(userMention[1])
            const player = getstats.get(usercalled.id, usercalled.tag)

            if (!player) return message.channel.send('This user is not a player!')

            const spying = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(usercalled.username + '\'s Inventory')
                .setThumbnail(usercalled.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Money", value: `${player.money} $`, inline: true },
                    { name: 'Energy', value: `${player.mana} mana / 150`, inline: true}
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            message.channel.send(spying)
        }
    }
};