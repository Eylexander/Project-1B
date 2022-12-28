const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "mp",
    description: 'Private Message anyone!',
    aliases : ['privatemessage','pm'],
    usage : '[Tag] [Information]',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;

    switch (args[0]) {
        case undefined:
        case null:
            message.reply({content: 'You have to tag or Id someone !', allowedMentions: { repliedUser: false }});
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();

                setTimeout(() => {message.delete()}, 500)

                getMentionTag.send(args.slice(1).join(' '));
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
            .setDescription('The user to send the message to')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('message')
            .setDescription('The message to send')
            .setRequired(true))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;

    const userMention = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    userMention.send(message);
};