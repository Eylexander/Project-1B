const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { weathertoken } = require('../../settings.json');
const axios = require('axios');
const { makeName, randomColor } = require('../../tools/Loader');

// Create the json script for the help command
module.exports.help = {
    name : "weather",
    description: 'Weather command',
    aliases : ['wthr', 'meteo'],
    usage : '[city]',
    parameters: '<city>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check the inputs
    switch (args[0]) {
        case undefined:
        case null:
            // Send a message if the user didn't enter a city
            message.reply({
                content: 'Check your inputs, name the city you want to check please.',
                allowedMentions: { repliedUser: false }
            })
            break;

        default:
            // Get the weather data from the API
            const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${makeName(args[0].toLowerCase())}&units=metric&appid=${weathertoken}`)

            // Get the data from the API
            const currentTemp = Math.ceil(data.main.temp)
            const wind = data.wind.speed;
            const icon = data.weather[0].icon
            const cityName = makeName(args[0].toLowerCase())
            const country = data.sys.country
            const cloudness = data.weather[0].description;
            const { pressure, humidity, temp_max, temp_min  } = data.main;

            // Create the embed
            const getWeatherEmbed = new EmbedBuilder()
                .setColor(randomColor())
                .setTitle(`${cityName}, ${country}`)
                .setURL(`https://www.openstreetmap.org/#map=12/${data.coord.lat}/${data.coord.lon}`)
                .setDescription(`The temperature is ${currentTemp}\u00B0C`)
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
            
            // Send the embed
            message.reply({
                embeds: [getWeatherEmbed],
                allowedMentions: { repliedUser: false }
            });
            break;
    }
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('city')
            .setDescription('City name')
            .setRequired(true))
    .setDMPermission(true)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    // Get the weather data from the API
    try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${makeName(args[0].toLowerCase())}&units=metric&appid=${weathertoken}`)

        const currentTemp = Math.ceil(data.main.temp)
        const wind = data.wind.speed;
        const icon = data.weather[0].icon
        const cityName = makeName(args[0].toLowerCase())
        const country = data.sys.country
        const cloudness = data.weather[0].description;
        const { pressure, humidity, temp_max, temp_min  } = data.main;

        // Create the embed
        const getWeatherEmbed = new EmbedBuilder()
            .setColor(randomColor())
            .setTitle(`${cityName}, ${country}`)
            .setURL(`https://www.openstreetmap.org/#map=12/${data.coord.lat}/${data.coord.lon}`)
            .setDescription(`The temperature is ${currentTemp}\u00B0C`)
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
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})
            
        // Send the embed
        interaction.reply({ embeds: [getWeatherEmbed] });

    } catch (error) {
        interaction.reply('Check your inputs, name the city you want to check please.')
    }
};