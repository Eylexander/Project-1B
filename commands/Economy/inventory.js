const { EmbedBuilder } = require("discord.js");
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');

module.exports.help = {
    name : "inventory",
    description: 'See your Inventory!',
    aliases : ['me','balance','inv','money'],
    usage : '< none | player >',
    parameters: '<tag>'
};

module.exports.execute = async (client, message, args) => {
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ?");
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana) VALUES (@id, @user, @money, @mana);"
    );

    let playerStats = getStats.get(message.author.id)
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

    const getPlayerInventory = new EmbedBuilder()
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setTitle(message.author.username + '\'s Inventory')
        .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
        .addFields(
            { name: "Money", value: `${playerStats.money} $`, inline: true },
            { name: 'Energy', value: `${playerStats.mana} mana / 150`, inline: true}
        )
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})


    switch(args[0]) {
        case undefined || null:
            message.channel.send(getPlayerInventory)
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();
                const getStranger = getStats.get(getMentionTag.id)

                if (!getStranger) return message.channel.send('This user is not a player!')

                const getUserTagEmbed = new EmbedBuilder()
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setTitle(getMentionTag.username + '\'s Inventory')
                    .setThumbnail(getMentionTag.displayAvatarURL({ dynamic : true }))
                    .addFields(
                        { name: "Money", value: `${getStranger.money} $`, inline: true },
                        { name: 'Energy', value: `${getStranger.mana} mana / 150`, inline: true}
                    )
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                
                message.channel.send({ embeds: [getUserTagEmbed] })
                    
            } else {
                // if (args[0].match(/([0-9]*)/)) {
                //     const getMentionId = args[0].match(/([0-9]*)/)
                //     const getStrangerbyId = getStats.get(getMentionId[1]);

                //     if (!getStrangerbyId) return message.channel.send('This user is not a player!')

                //     const getUserIdEmbed = new EmbedBuilder()
                //         .setColor(Math.floor(Math.random() * 16777214) + 1)
                //         .setTitle(getStrangerbyId.tag.split("#")[0] + '\'s Inventory')
                //         .setThumbnail(getUserObjectId.displayAvatarURL({ dynamic : true }))
                //         .addFields(
                //             { name: "Money", value: `${getStrangerbyId.money} $`, inline: true },
                //             { name: 'Energy', value: `${getStrangerbyId.mana} mana / 150`, inline: true}
                //         )
                //         .setTimestamp()
                //         .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    
                //     message.channel.send({ embeds: [getUserIdEmbed] })
                // }
                message.channel.send({ embeds: [getPlayerInventory] })
            }
            break;
    }
};