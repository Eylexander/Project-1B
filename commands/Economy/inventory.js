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
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);"
    );

    let playerStats = getStats.get(message.author.id, message.author.tag)
    if (!playerStats) {
        playerStats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10
        }
        setStats.run(playerStats)
        message.channel.send(`You've just created your own profile!`)
    }

    const getPlayerInventory = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setTitle(message.author.username + '\'s Inventory')
        .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
        .addFields(
            { name: "Money", value: `${playerStats.money} $`, inline: true },
            { name: 'Energy', value: `${playerStats.mana} mana / 150`, inline: true}
        )
        .setTimestamp()
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    if (!args[0]) {
        return message.channel.send(getPlayerInventory)
    } else {
        if (!args[0].match(/<@!?([0-9]*)>/)) {
            return message.channel.send(getPlayerInventory)
        } else {
            const getMentionId = args[0].match(/<@!?([0-9]*)>/)
            const getUserObject = client.users.cache.get(getMentionId[1])
            const getStranger = getStats.get(getUserObject.id, getUserObject.tag)

            if (!getStranger) return message.channel.send('This user is not a player!')

            const getStrangerInventory = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle(getUserObject.username + '\'s Inventory')
                .setThumbnail(getUserObject.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Money", value: `${getStranger.money} $`, inline: true },
                    { name: 'Energy', value: `${getStranger.mana} mana / 150`, inline: true}
                )
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            message.channel.send(getStrangerInventory)
        }
    }
};