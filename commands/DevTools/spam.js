const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spam",
    description: 'Spam command',
    aliases : ['annoy','repeat'],
    usage : '[number] [Information]',
    parameters: '<Number>'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;

    if (!args[0]) return message.reply({ content: "You have to enter a number !", allowedMentions: { repliedUser: false }})

    setTimeout(() => {message.delete()}, 500)
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < args[0]; i++) {
        message.channel.send(args.slice(1).join(' '));
        await sleep(500);
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addIntegerOption(option =>
        option
            .setName('number')
            .setDescription('Number of times to repeat')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('message')
            .setDescription('Message to repeat')
            .setRequired(true))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < interaction.options.getInteger('number'); i++) {
        interaction.channel.send(interaction.options.getString('message'));
        await sleep(500);
    }

    interaction.reply({ content: `Sent ${interaction.options.getInteger('number')} messages.`, ephemeral: true })
};