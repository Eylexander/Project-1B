const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json');
const db = require("better-sqlite3");
const ban = new db('./database/blockedusers.sqlite');

module.exports.help = {
    name : "botban",
    description: 'Permaban users from using the bot',
    aliases : ['permaban','blockuser'],
    usage : '[user]',
    parameters: '<tag>'
};

module.exports.execute = async (client, message, args) => {
    const getBannedUserById = ban.prepare("SELECT * FROM ban WHERE id = ?;");
    const getListBanned = ban.prepare("SELECT id, user FROM ban;").all();

    if (!message.author.id === admin) return;

    switch (args[0]) {
        case 'list':
        case 'count':
            if (getListBanned.length == 0) {
                message.channel.send("There is no banned users.")
            } else {
                for (const data of getListBanned) {
                    message.channel.send(`Banned user: ${data.user} (${data.id})`)
                }
                message.channel.send(`There are ${getListBanned.length} users banned.`)
            }
            break;
        case 'add':
        case 'ban':
            if (!args[1]) {
                message.channel.send("Please specify a user to ban.")
            } else {
                if (message.mentions.users.first()) {
                    const getMentionTag = message.mentions.users.first()

                    if (!getBannedUserById.get(getMentionTag.id)) {
                        ban.prepare(`INSERT INTO ban (id, user) VALUES (${getMentionTag.id}, '${getMentionTag.username}');`).run();
                        return message.channel.send(`Banned user ${getMentionTag.username} (${getMentionTag.id})`)
                    } else {
                        return message.channel.send(`User ${getMentionTag.username} (${getMentionTag.id}) is already banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        if (!getBannedUserById.get(getUserObjectId.id)) {
                            ban.prepare(`INSERT INTO ban (id, user) VALUES (${getUserObjectId.id}, '${getUserObjectId.user}');`).run();
                            return message.channel.send(`Banned user ${getUserObjectId.id} (${getUserObjectId.user})`)
                        } else {
                            return message.channel.send(`User ${getUserObjectId.user} (${getUserObjectId.id}) is already banned.`)
                        }
                    }
                }
            }
        case 'remove':
        case 'unban':
            if (!args[1]) {
                message.channel.send("Please specify a user to unban.")
            } else {
                if (message.mentions.users.first()) {
                    const getMentionTag = message.mentions.users.first();

                    if (getBannedUserById.get(getMentionTag.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${getMentionTag.id}`).run();
                        return message.channel.send(`Unbanned user ${getMentionTag.username} (${getMentionTag.id})`)
                    } else {
                        return message.channel.send(`User ${getMentionTag.username} (${getMentionTag.id}) is not banned.`)
                    }
                } else {
                    if (args[1].match(/^([0-9]*$)/)) {
                        const getMentionId = args[1].match(/([0-9]*)/)
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        if (!getUserObjectId)
                        return message.channel.send(`User ID (${getMentionId[1]}) is not banned.`)

                        ban.prepare(`DELETE FROM ban WHERE id = ${getUserObjectId.id}`).run();
                        return message.channel.send(`Unbanned user ${getUserObjectId.id} (${getUserObjectId.user})`)
                    }
                }
            }
        default:
            message.channel.send("You must provide someone's ID or try a few parameters.")
            message.channel.send("Usage: botban [add/remove/list] [user]")
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all banned users'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Ban a user')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to ban')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Unban a user')
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('The user to unban')
                    .setRequired(true))
            .addStringOption(option =>
                option
                    .setName('id')
                    .setDescription('The user ID to unban')))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    const getBannedUserById = ban.prepare("SELECT * FROM ban WHERE id = ?;");
    const getListBanned = ban.prepare("SELECT id, user FROM ban;").all();

    if (!interaction.user.id === admin) return;

    switch (interaction.options.getSubcommand()) {
        case 'list':
            if (getListBanned.length == 0) {
                interaction.reply("There is no banned users.")
            } else {
                for (const data of getListBanned) {
                    interaction.channel.send(`Banned user: ${data.user} (${data.id})`)
                }
                interaction.reply(`There are ${getListBanned.length} users banned.`)
            }
            break;
        case 'add':
            if (!interaction.options.getUser('user')) {
                interaction.reply({ content: "Please specify a user to ban.", ephemeral: true })
            } else {
                const getMentionTag = interaction.options.getUser('user')

                if (!getBannedUserById.get(getMentionTag.id)) {
                    ban.prepare(`INSERT INTO ban (id, user) VALUES (${getMentionTag.id}, '${getMentionTag.username}');`).run();
                    return interaction.reply(`Banned user ${getMentionTag.username} (${getMentionTag.id})`)
                } else {
                    return interaction.reply(`User ${getMentionTag.username} (${getMentionTag.id}) is already banned.`)
                }
            }
        case 'remove':
            if (!interaction.options.getUser('user') && !interaction.options.getString('id')) {
                interaction.reply({ content: "Please specify a user to unban.", ephemeral: true })
            } else {
                if (interaction.options.getUser('user')) {
                    const getMentionTag = interaction.options.getUser('user');

                    if (getBannedUserById.get(getMentionTag.id)) {
                        ban.prepare(`DELETE FROM ban WHERE id = ${getMentionTag.id}`).run();
                        return interaction.reply(`Unbanned user ${getMentionTag.username} (${getMentionTag.id})`)
                    } else {
                        return interaction.reply(`User ${getMentionTag.username} (${getMentionTag.id}) is not banned.`)
                    }
                } else {
                    if (interaction.options.getString('id').match(/^([0-9]*$)/)) {
                        const getMentionId = interaction.options.getString('id').match(/([0-9]*)/)
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        if (!getUserObjectId)
                        return interaction.reply(`User ID (${getMentionId[1]}) is not banned.`)

                        ban.prepare(`DELETE FROM ban WHERE id = ${getUserObjectId.id}`).run();
                        return interaction.reply(`Unbanned user ${getUserObjectId.id} (${getUserObjectId.user})`)
                    }
                }
            }
        default:
            interaction.reply("You must provide someone's ID or try a few parameters.")
            interaction.reply("Usage: botban [add/remove/list] [user]")
            break;
    }
};
