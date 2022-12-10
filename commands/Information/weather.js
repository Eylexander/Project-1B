const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { weathertoken } = require('../../settings.json');

module.exports.help = {
    name : "weather",
    description: 'Weather command',
    aliases : ['wthr', 'meteo'],
    usage : '[city]',
    parameters: '<city>'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        message.channel.send('Check your inputs, name the city you want to check please.')
    } else {
        const inputs = args[0].toLowerCase();
        const FirstUpperCase = inputs.charAt(0).toUpperCase() + inputs.slice(1);

        const {data} = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${FirstUpperCase}&units=metric&appid=${weathertoken}`)

        const currentTemp = Math.ceil(data.main.temp)
        const wind = data.wind.speed;
        const icon = data.weather[0].icon
        const cityName = FirstUpperCase
        const country = data.sys.country
        const cloudness = data.weather[0].description;
        const { pressure, humidity, temp_max, temp_min  } = data.main;

        const getWeatherEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTitle(`The temperature is ${currentTemp}\u00B0C in ${cityName}, ${country}`)
            .addFields(
                { name: `Maximum Temperature:`, value: `${temp_max}\u00B0C`, inline: true },
                { name: `Minimum Temperature:`, value: `${temp_min}\u00B0C`, inline: true },
                { name: `Humidity:`, value: `${humidity} %`, inline: true },
                { name: `Wind Speed:`, value: `${wind} m/s`, inline: true },
                { name: `Pressure:`, value: `${pressure} hpa`, inline: true },
                { name: `Cloudiness:`, value: `${cloudness}`, inline: true },
            )
            .setThumbnail(`http://openweathermap.org/img/w/${icon}.png`)
            .setTimestamp()
            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
        
        message.channel.send({ embeds: [getWeatherEmbed] });
    }
};