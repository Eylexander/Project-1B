const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { newsapi } = require('../../settings.json');
const axios = require('axios');

module.exports.help = {
    name : "news",
    description: 'News about everything but it is very random',
    aliases : ['news','newscrypto'],
    usage : '[topic]',
    parameters: '<topic>'
};

module.exports.execute = async (client, message, args) => {
    const NewsField = args[0] === undefined ? 'crypto' : args[0].toLowerCase();

    const { data } = await axios.get(`https://newsapi.org/v2/everything?q=${NewsField}&apiKey=${newsapi}&pageSize=1&sortBy=publishedAt&language=en`);

    const {
        title,
        source: { name },
        description,
        url,
        urlToImage
    } = data.articles[0];

    const getNewsEmbed = new EmbedBuilder()
        .setTitle(title)
        .setURL(url)
        .setColor(Math.floor(Math.random() * 16777215) + 1)
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `Article:`, value: `${description}`, inline: false},
            {name: name, value: `${url}`, inline: false}
        )
        .setImage(urlToImage)
        .setTimestamp()
        .setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

    return message.reply({embeds: [getNewsEmbed], allowedMentions: { repliedUser: false }});
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('topic')
            .setDescription('Topic of the news')
            .setRequired(false))
    .setDMPermission(true);

module.exports.run = async (client, interaction) => {
    // const NewsField = interaction.options.getString('topic') === null ? 'crypto' : interaction.options.getString('topic').toLowerCase();
    const NewsField = interaction.options?.getString('topic') ?? 'crypto';

    const { data } = await axios.get(`https://newsapi.org/v2/everything?q=${NewsField.toLowerCase()}&apiKey=${newsapi}&pageSize=1&sortBy=publishedAt&language=en`);

    const {
        title,
        source: { name },
        description,
        url,
        urlToImage
    } = data.articles[0];

    const getNewsEmbed = new EmbedBuilder()
        .setTitle(title)
        .setURL(url)
        .setColor(Math.floor(Math.random() * 16777215) + 1)
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `Article:`, value: `${description}`, inline: false},
            {name: name, value: `${url}`, inline: false}
        )
        .setImage(urlToImage)
        .setTimestamp()
        .setFooter({text: `Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic : true })});

    return interaction.reply({embeds: [getNewsEmbed]});
};
