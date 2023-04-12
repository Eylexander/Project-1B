const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3');
const inv = new db('./database/economy/stats.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "give",
    aliases: ['gift'],
    description: "Give money/items to a user",
    usage: '[user] [item] [amount]',
    parameters: '[user] [item] [amount]',
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ?;");

    if (args.length < 3)
    return message.reply({
        content: "You must specify a user, an item and an amount!",
        ephemeral: true,
        allowedMentions: { repliedUser: false }
    })

    // Check if the user has a profile
    const profile = getStats.get(message.author.id);

    if (!profile)
    return message.reply({
        content: "You don't have a profile yet! Create one with the `inventory` command!",
        ephemeral: true,
        allowedMentions: { repliedUser: false }
    })

    // Check the target user
    // Get the user ID from the mention or the ID
    let getMentionObject;
    if (message.mentions.users.first()) {
        getMentionObject = message.mentions.users.first();
    } else {
        if (args[0].match(/([0-9]*)/)) {
            getMentionObject = args[0].match(/([0-9]*)/);
        }
    }

    // Get the user object from the mention or the ID
    const getUserObject = getStats.get(getMentionObject?.id ?? getMentionObject[1]);

    // Check if the user has a profile
    if (!getUserObject)
    return message.reply({
        content: "The user doesn't have a profile yet!",
        ephemeral: true,
        allowedMentions: { repliedUser: false }
    })

    let item = args[1].toLowerCase();

    if (!['money'].includes(item))
    return message.reply({
        content: "The item to give is not valid!",
        ephemeral: true,
        allowedMentions: { repliedUser: false }
    })

    // Check the amount of money to give
    if (!Number(args[2]))
    return message.reply({
        content: "The amount to give is not a number!",
        ephemeral: true,
        allowedMentions: { repliedUser: false }
    })

    // Everything is good, let's give the money
    inv.prepare(`UPDATE stats SET ${item} = ${item} + ? WHERE id = ?;`).run(args[2], getUserObject.id);
    inv.prepare(`UPDATE stats SET ${item} = ${item} - ? WHERE id = ?;`).run(args[2], message.author.id);

    // Send the message
    const embed = new EmbedBuilder()
        .setTitle("Item(s) given")
        .setDescription(`You gave ${args[2]} ${item === 'money' ? '$' : item} to ${getUserObject.user}!`)
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

    message.reply({
        embeds: [embed],
        allowedMentions: { repliedUser: false }
    })


};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user to give money to')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('item')
            .setDescription('The item to give')
            .setRequired(true))
    .addIntegerOption(option =>
        option
            .setName('amount')
            .setDescription('The amount of the item to give')
            .setRequired(true))
    .setDMPermission(false)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    interaction.reply("This command is not ready yet !");
};