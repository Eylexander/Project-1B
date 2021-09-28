const {newsapi} = require('C:/Users/Eylexander/Desktop/Projets/Project-1B/settings.json');
const Discord = require('discord.js');
const axios = require('axios');

module.exports.help = {
    name : "news",
    description: 'News about everything but it is very random',
    aliases : ['news','newscrypto'],
    usage : '[topic]'
};

module.exports.execute = async (client, message, args) => {
    try {
        const { data } = await axios.get(`https://newsapi.org/v2/everything?q=${args[0].toLowerCase()}&apiKey=${newsapi}&pageSize=1&sortBy=publishedAt`);
  
        // Destructure useful data from response
        const {
            title,
            source: { name },
            description,
            url,
            urlToImage,
        } = data.articles[0];
    
        const embed = new Discord.MessageEmbed()
            .setAuthor('News', client.user.displayAvatarURL({ dynamic : true }))
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