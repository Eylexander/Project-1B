const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { ricks } = require('../../tools/word_libraries.json')

module.exports.help = {
    name: 'rickroll',
    description: 'Rickroll the people',
    aliases: ['rick', 'troll', 'rr'],
    usage: '[user]',
    parameters: '<user>'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0] || !message.mentions.users.first()) {
        return message.reply({ content: "You have to tag someone !", allowedMentions: { repliedUser: false }})
    } else {
        const userMention = message.mentions.users.first();

        const RickrollEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setDescription(`**${message.author.username}** rickrolled **${userMention.username}** !`)
            .setImage(ricks[Math.floor(Math.random()*ricks.length)])
            .setTimestamp()
            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

        return message.channel.send({ embeds: [RickrollEmbed] });
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addUserOption(option => 
        option
            .setName('user')
            .setDescription('The user to rickroll')
            .setRequired(true))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    const userMention = interaction.options.getUser('user');

    const RickrollEmbed = new EmbedBuilder()
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setDescription(`**${interaction.member.user.username}** rickrolled **${userMention.username}** !`)
        .setImage(ricks[Math.floor(Math.random()*ricks.length)])
        .setTimestamp()
        .setFooter({ text :`Requested by ${interaction.member.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

    return interaction.reply({ embeds: [RickrollEmbed] });
};