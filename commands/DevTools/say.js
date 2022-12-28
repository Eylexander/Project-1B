const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "say",
    description: 'Say command',
    aliases : ['tell','shout'],
    usage : '[Information]',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin || message.member.permissions.has('ADMINISTRATOR')) {
        message.channel.bulkDelete(1)
        message.channel.send(args.join(' '))
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('message')
            .setDescription('Message to say')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ADMINISTRATOR)
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    if ((interaction.member?.user.id ?? interaction.user.id == admin)) {
        interaction.channel.send(interaction.options.getString('message'));
        return interaction.reply({ content: `Sent message.`, ephemeral: true })
    }
    interaction.channel.send(interaction.options.getString('message'));
    interaction.reply({ content: `Sent message.`, ephemeral: true })
};