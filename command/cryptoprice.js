const Discord = require('discord.js');
const axios = require('axios');
const {prefix} = require('../settings.json');

module.exports.help = {
    name : "price",
    description : "Check the cryptocurrency market",
    aliases : ['check', 'crypto'],
    usage : '[Crypto Name] [Currency]'
}

module.exports.execute = async (client, message, args) => {
    if (args.length !== 2) {
        return message.reply(
            `You must provide the crypto and the currency you want to compare:\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`
        );
    } else {
        const [coin, vsCurrency] = args;
        try {
            const { data } = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency}`); // Get crypto price from coingecko API
            
            if (!data[coin][vsCurrency]) throw Error(); // Check if data exists
            const crypto = coin.charAt(0).toUpperCase() + coin.slice(1);
            const currency = vsCurrency.toUpperCase();

            const embed = new Discord.MessageEmbed()
                .setColor('RANDOM')
                .setTitle("CoinGecko API")
                .setURL(`https://www.coingecko.com/en/coins/${coin}`)
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    {name: `${crypto} in ${currency}`, value:`${data[coin][vsCurrency]}`, inline: true}
                )
                .setImage('https://static.coingecko.com/s/coingecko-logo-d13d6bcceddbb003f146b33c2f7e8193d72b93bb343d38e392897c3df3e78bdd.png')
                .setTimestamp()
                .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            return message.channel.send(embed);
        } catch (err) {
            return message.reply(
                `Please check your inputs.\n${prefix}${module.exports.help.name} ${module.exports.help.usage}`
            );
        }
    }
};