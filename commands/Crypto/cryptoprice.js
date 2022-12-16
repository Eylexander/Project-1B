const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const {prefix} = require('../../settings.json');

module.exports.help = {
    name : "price",
    description : "Check the cryptocurrency market",
    aliases : ['check', 'crypto'],
    usage : '[Crypto Name] [Currency]',
    parameters : '<crypto> <currency>'
}

module.exports.execute = async (client, message, args) => {
    switch (args[0]) {
        case undefined:
        case null:
            message.reply({content: `You must provide the crypto and the currency you want to compare:\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`, allowedMentions: { repliedUser: false }});
            break;
        case args[0]:
            const coin = args[0].toLowerCase(); // Get rid off the grammar
            const vsCurrency = args[1] === undefined ? 'usd' : args[1].toLowerCase();

            const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency}`); // Get crypto price from coingecko API
            
            if (!data[coin][vsCurrency]) throw Error(); // Check if data exists
            const crypto = coin.charAt(0).toUpperCase() + coin.slice(1);
            const currency = vsCurrency.toUpperCase();

            const getDataEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777215) + 1)
                .setTitle("CoinGecko API")
                .setURL(`https://www.coingecko.com/en/coins/${coin}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    {name: `${crypto} in ${currency}`, value:`${data[coin][vsCurrency]}`, inline: true}
                )
                .setImage('https://static.coingecko.com/s/coingecko-logo-d13d6bcceddbb003f146b33c2f7e8193d72b93bb343d38e392897c3df3e78bdd.png')
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            message.reply({embeds: [getDataEmbed], allowedMentions: { repliedUser: false }});
            break;
        default:
            message.reply({content: `Please check your inputs.\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`, allowedMentions: { repliedUser: false }});
            break;
    }
};