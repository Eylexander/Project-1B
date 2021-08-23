const {newsapi} = require("../settings.json");
const Discord = require('discord.js');
const axios = require('axios');

module.exports.help = {
    name : "cryptonews",
    description: 'Crypto News',
    aliases : ['news','newscrypto'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    try {
        const { data } = await axios.get(`https://newsapi.org/v2/everything?q=crypto&apiKey=${newsapi}&pageSize=1&sortBy=publishedAt`);
  
        // Destructure useful data from response
        const {
            title,
            source: { name },
            description,
            url,
            urlToImage,
        } = data.articles[0];
    
        const embed = new Discord.MessageEmbed()
            .setAuthor('CryptoNews', client.user.displayAvatarURL({ dynamic : true }))
            .setTitle(title)
            .setURL(url)
            .setColor('RANDOM')
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                {name: `Article:`, value: `${description}`, inline: false},
                {name: name, value: `${url}`, inline: false}
            )
            .setImage(urlToImage)
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        return message.channel.send(embed)
    } catch (err) {
        return message.reply('There was an error.');
    }
};