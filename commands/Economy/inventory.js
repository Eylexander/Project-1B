const Discord = require("discord.js");
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "inventory",
    description: 'See your own stuff!',
    aliases : ['me','balance','inv'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    const getstats = inv.prepare("SELECT * FROM stats WHERE id = ? AND user = ?");

    let stats = getstats.get(message.author.id, message.author.tag)
    if (!stats) {
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 0
        }
    }

    const inventory = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setTitle(message.author.username + ' Inventory')
        .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
        .addFields(
            { name: "Money", value: `${stats.money}$`, inline: true },
            { name: 'Energy', value: `${stats.mana} mana`, inline: true}
        )
        .setTimestamp()
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(inventory)
};