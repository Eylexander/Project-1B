const Discord = require("discord.js");
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "inventory",
    description: 'See your own stuff!',
    aliases : ['me','balance','inv','money'],
    usage : ''
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
            const user = client.users.cache.get(userMention[1])
            const victim = getstats.get(user.id, user.tag)

            const spying = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(user.username + '\'s Inventory')
                .setThumbnail(user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Money", value: `${victim.money} $`, inline: true },
                    { name: 'Energy', value: `${victim.mana} mana / 150`, inline: true}
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            message.channel.send(spying)
        }
    }
};