const { EmbedBuilder } = require('discord.js');
const { admin } = require('../../settings.json');
const db = require("better-sqlite3");
const bansDB = new db('./database/devtools/banList.sqlite');

// Create the json script for the help command
module.exports.help = {
    name : "botban",
    description: 'Permaban users from using the bot',
    aliases : ['permaban','blockuser'],
    usage : '[user]',
    parameters: '<tag>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the bot owner
    if (message.author.id !== admin) return;

    // Get the user ID of specific banned user
    const getBannedUserById = bansDB.prepare("SELECT id FROM banlist WHERE id = ?;");
    // Get the user ID and username of every banned user
    const getListBanned = bansDB.prepare("SELECT id, user FROM banlist;").all();
    // Delete the user from the banlist
    const deleteBannedUser = bansDB.prepare("DELETE FROM banlist WHERE id = ?;");

    // Check the inputs of the user
    switch (args[0]) {
        // If the user want to list all banned users
        case 'list':
        case 'count':
            // Check if there is no banned users
            if (getListBanned.length == 0) {
                // Send a message to the channel
                message.reply({
                    content: "There is no banned users.",
                    allowedMentions: { repliedUser: false }
                })

            } else {
                // Create a new embed
                const getBannedListEmbed = new EmbedBuilder()
                    .setTitle("Banned users")
                    .setColor(Math.floor(Math.random() * 16777215) + 1)
                    .setDescription(getListBanned.length == '1' ? `There is ${getListBanned.length} banned user.` : `There are ${getListBanned.length} banned users.`)
                    .addFields()
                    .setTimestamp()
                    .setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

                // Add the banned users to the embed
                for (const data of getListBanned) {
                    // Add the user to the embed
                    getBannedListEmbed.addFields({
                        name: `Banned user: ${data.user} (${data.id.toString()})`,
                        value: "⠀"
                    })
                }
                
                // Send the embed to the channel
                message.reply({
                    embeds: [getBannedListEmbed],
                    allowedMentions: { repliedUser: false }
                })
            }
            break;
            
        case 'add':
        case 'ban':
            // Check if the user didn't specify a user to ban
            if (!args[1]) {
                // Send a message to the channel
                message.reply({
                    content: "Please specify a user to ban.",
                    allowedMentions: { repliedUser: false }
                })
            }
            else if (message.mentions.users.first() === `<@${admin}>`) {
                // Check if the user is trying to ban the bot owner
                message.reply({
                    content: "You can't ban the bot owner.",
                    allowedMentions: { repliedUser: false }
                })
            }
            else if (message.mentions.users.first()) {

                // Get the user object of the mentioned user
                const getMentionTag = message.mentions.users.first()

                // Check if the user is already banned
                if (!getBannedUserById.get(getMentionTag.id)) {
                    // Ban the user
                    bansDB.prepare(`INSERT INTO banlist (id, user) VALUES (${getMentionTag.id}, '${getMentionTag.username}');`).run();
                    // Send a message to the channel
                    message.reply({
                        content: `Banned user ${getMentionTag.username} (${getMentionTag.id})`,
                        allowedMentions: { repliedUser: false }
                    })
                } else {
                    // Send a message to the channel
                    message.reply({
                        content: `User ${getMentionTag.username} (${getMentionTag.id}) is already banned.`,
                        allowedMentions: { repliedUser: false }
                    })
                }
            }
            break;

        case 'remove':
        case 'unban':
            // Check if the user didn't specify a user to unban
            if (!args[1]) {
                // Send a message to the channel
                message.reply({
                    content: "Please specify a user to unban.",
                    allowedMentions: { repliedUser: false }
                })
                
            } else {
                // Check the type of the user
                if (message.mentions.users.first()) {
                    // Get the user object of the mentioned user
                    const getMentionTag = message.mentions.users.first();

                    // Check if the user is banned
                    if (getBannedUserById.get(getMentionTag.id)) {
                        // Unban the user
                        deleteBannedUser.run(getMentionTag.id);
                        // Send a message to the channel
                        return message.reply({
                            content: `Unbanned user ${getMentionTag.username} (${getMentionTag.id})`,
                            allowedMentions: { repliedUser: false }
                        })

                    } else {
                        // Send a message to the channel if the user is not banned
                        return message.reply({
                            content: `User ${getMentionTag.username} (${getMentionTag.id}) is not banned.`,
                            allowedMentions: { repliedUser: false }
                        })
                    }

                } else {
                    // Check if the user is trying to unban a user by ID
                    if (args[1].match(/^([0-9]*$)/)) {
                        // Const the user ID
                        const getMentionId = args[1].match(/([0-9]*)/);
                        // Get the user object of the banned user
                        const getUserObjectId = getBannedUserById.get(getMentionId[1]);

                        // Check if the user is not banned
                        if (!getUserObjectId)
                        return message.reply({
                            content: `User ${getUserObjectId.user} (${getUserObjectId.id}) is not banned.`,
                            allowedMentions: { repliedUser: false }
                        })

                        // Unban the user
                        deleteBannedUser.run(getUserObjectId.id);
                        // Send a message to the channel
                        message.reply({
                            content: `Unbanned user ${getUserObjectId.user} (${getUserObjectId.id})`,
                            allowedMentions: { repliedUser: false }
                        })
                    }
                }
            }
            break;

        case 'clear':
        case 'reset':
        case 'drop':

            // Check if there is no banned users
            if (getListBanned.length == 0) {
                // Send a message to the channel
                message.reply({
                    content: "There is no banned users.",
                    allowedMentions: { repliedUser: false }
                })
            } else {
                // Drop the table
                bansDB.prepare(`DELETE FROM ban`).run();
                // Send a message to the channel
                message.reply({
                    content: "Cleared the banned users list.",
                    allowedMentions: { repliedUser: false }
                })
            }
            break;

        default:
            message.reply({
                content: "Please specify a valid subcommand. \nUse `/help ban` for more information.",
                allowedMentions: { repliedUser: false }
            })
            break;
    }
};