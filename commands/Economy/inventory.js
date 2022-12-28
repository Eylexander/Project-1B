const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');

module.exports.help = {
    name: "inventory",
    description: 'See your Inventory!',
    aliases: ['me','balance','inv','money'],
    usage: '< none | player >',
    parameters: '<tag>'
};

module.exports.execute = async (client, message, args) => {
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ?");
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, business, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @business, @level, @xp);"
    );
    const makeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

    let playerStats = getStats.get(message.author.id)
    inv.prepare(`UPDATE stats SET user = '${message.author.tag}' WHERE id = ${message.author.id}`).run();
    if (!playerStats) {
        playerStats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10,
            maxmana : 150,
            business : 'none',
            businessID : 0,
            level : 1,
            xp : 0,
        }
        setStats.run(playerStats)
        message.channel.send(`You've just created your own profile!`)
    }

    switch(args[0]) {
        case undefined:
        case null:
            const getPlayerInventory = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(message.author.username + '\'s Inventory')
                .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Money", value: `${playerStats.money} $`, inline: true },
                    { name: 'Energy', value: `${playerStats.mana} mana / 150`, inline: true},
                    { name: 'Business', value: `${makeName(playerStats.business)}`, inline: false},
                    { name: 'Level', value: `${playerStats.level}`, inline: true},
                    { name: 'XP', value: `${playerStats.xp}`, inline: true}
                )
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            message.reply({ embeds: [getPlayerInventory], allowedMentions: { repliedUser: false }})
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
                        { name: 'Energy', value: `${getStranger.mana} mana / 150`, inline: true},
                        { name: 'Business', value: `${makeName(getStranger.business)}`, inline: false},
                        { name: 'Level', value: `${getStranger.level}`, inline: true},
                        { name: 'XP', value: `${getStranger.xp}`, inline: true}
                    )
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    
                return message.reply({ embeds: [getUserTagEmbed], allowedMentions: { repliedUser: false }})
                    
            } else {
                if (args[0].match(/([0-9]*)/)) {
                    const getMentionId = args[0].match(/([0-9]*)/)
                    const getStrangerbyId = getStats.get(getMentionId[1]);

                    if (!getStrangerbyId) return message.channel.send('This user is not a player!')

                    const getUserIdEmbed = new EmbedBuilder()
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        .setTitle(getStrangerbyId.user.split('#')[0] + '\'s Inventory')
                        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                        .addFields(
                            { name: "Money", value: `${getStrangerbyId.money} $`, inline: true },
                            { name: 'Energy', value: `${getStrangerbyId.mana} mana / 150`, inline: true},
                            { name: 'Business', value: `${makeName(getStrangerbyId.business)}`, inline: false},
                            { name: 'Level', value: `${getStrangerbyId.level}`, inline: true},
                            { name: 'XP', value: `${getStrangerbyId.xp}`, inline: true}
                        )
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                        
                    return message.reply({ embeds: [getUserIdEmbed], allowedMentions: { repliedUser: false }})
                }
            }
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('player')
            .setDescription('The player you want to see the inventory of'))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    interaction.reply({ content: "This command is not yet available!", ephemeral: true })
};