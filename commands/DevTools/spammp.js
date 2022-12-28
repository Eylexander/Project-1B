const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spammp",
    description: 'Spam a user trough DM',
    aliases : ['mpspam','spamdm'],
    usage : '[user] [amount] [message]',
    parameters: '<user> <amount>'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    switch (args[0] && args[1]) {
        case undefined:
        case null:
            message.reply({content: 'You have to tag or Id someone !', allowedMentions: { repliedUser: false }});
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();

                setTimeout(() => {message.delete()}, 500)

                for (let i = 0; i < args[1]; i++) {
                    getMentionTag.send(args.slice(2).join(' '));
                    await sleep(500);
                }
            } else {
                message.reply({content: 'You have to tag or Id someone !', allowedMentions: { repliedUser: false }});
            }
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user to spam')
            .setRequired(true))
    .addIntegerOption(option =>
        option
            .setName('number')
            .setDescription('The number of times to spam')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('message')
            .setDescription('The message to spam')
            .setRequired(true))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    const getUser = interaction.options.getUser('user');
    const getNumber = interaction.options.getInteger('number');
    const getMessage = interaction.options.getString('message');

    for (let i = 0; i < getNumber; i++) {
        getUser.send(getMessage);
        await sleep(500);
    }
};