const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { prefix } = require('../../settings.json');
const { randomColor, makeName } = require('../../tools/Loader.js');

// Create the json script for the help command
module.exports.help = {
    name : "cryptoprice",
    description : "Check the cryptocurrency market",
    aliases : ['check', 'price'],
    usage : '[Crypto Name] [Currency]',
    parameters : '<crypto> <currency>'
}

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user provided the crypto and the currency
    switch (args[0]) {
        case undefined:
        case null:
            // If not, send an error message
            message.reply({
                content: `You must provide the crypto and the currency you want to compare:\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`,
                allowedMentions: { repliedUser: false }
            });
            break;
        case args[0]:
            // If yes, continue the code
            // Get the crypto and the currency to lowercase
            const coin = args[0].toLowerCase(); // Get rid off the grammar
            const vsCurrency = args[1] === undefined ? 'usd' : args[1].toLowerCase();

            // Get the crypto price from coingecko API
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency}`); // Get crypto price from coingecko API
            
            // Check if data exists
            if (!data[coin][vsCurrency]) throw Error();

            // Create the embed
            const getDataEmbed = new EmbedBuilder()
                .setColor(randomColor())
                .setTitle("CoinGecko API")
                .setURL(`https://www.coingecko.com/en/coins/${coin}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    {name: `${makeName(coin)} in ${vsCurrency.toUpperCase()}`, value:`${data[coin][vsCurrency]}`, inline: true}
                )
                .setImage('https://static.coingecko.com/s/coingecko-logo-d13d6bcceddbb003f146b33c2f7e8193d72b93bb343d38e392897c3df3e78bdd.png')
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            // Send the embed
            message.reply({embeds: [getDataEmbed], allowedMentions: { repliedUser: false }});
            break;

        default:
            // If not, send an error message
            message.reply({content: `Please check your inputs.\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`, allowedMentions: { repliedUser: false }});
            break;
    }
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('crypto')
            .setDescription('The crypto you want to check')
            .setRequired(true))
    .addStringOption(option =>
        option
            .setName('currency')
            .setDescription('The currency you want to compare')
            .setRequired(false))
    .setDMPermission(true);

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    // Get the crypto and the currency to lowercase
    const coin = interaction.options.getString('crypto').toLowerCase();
    const vsCurrency = interaction.options?.getString('currency') ?? 'usd';

    // Get the crypto price from coingecko API
    const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency.toLowerCase()}`); // Get crypto price from coingecko API
    
    // Check if data exists
    if (!data[coin][vsCurrency]) throw Error();

    // Create the embed
    const getDataEmbed = new EmbedBuilder()
        .setColor(randomColor())
        .setTitle("CoinGecko API")
        .setURL(`https://www.coingecko.com/en/coins/${coin}`)
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            {name: `${makeName(coin)} in ${vsCurrency.toUpperCase()}`, value:`${data[coin][vsCurrency]}`, inline: true}
        )
        .setImage('https://static.coingecko.com/s/coingecko-logo-d13d6bcceddbb003f146b33c2f7e8193d72b93bb343d38e392897c3df3e78bdd.png')
        .setTimestamp()
        .setFooter({text: `Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic : true })});

    // Send the embed
    interaction.reply({embeds: [getDataEmbed], allowedMentions: { repliedUser: false }});
};
