const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { weathertoken } = require('../../settings.json');
const axios = require('axios');

module.exports.help = {
    name : "weather",
    description: 'Weather command',
    aliases : ['wthr', 'meteo'],
    usage : '[city]',
    parameters: '<city>'
};

module.exports.execute = async (client, message, args) => {
    switch (args[0]) {
        case undefined:
        case null:
            message.reply({
                content: 'Check your inputs, name the city you want to check please.',
                allowedMentions: { repliedUser: false }
            })
            break;
        default:
            const getInputs = args[0].toLowerCase();
            const makeFirstUpperCase = getInputs.charAt(0).toUpperCase() + getInputs.slice(1);

            const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${makeFirstUpperCase}&units=metric&appid=${weathertoken}`)

            const currentTemp = Math.ceil(data.main.temp)
            const wind = data.wind.speed;
            const icon = data.weather[0].icon
            const cityName = makeFirstUpperCase
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
                
            message.reply({ embeds: [getWeatherEmbed], allowedMentions: { repliedUser: false } });
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('city')
            .setDescription('City name')
            .setRequired(true))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    const getInputs = interaction.options.getString('city').toLowerCase();
    const makeFirstUpperCase = getInputs.charAt(0).toUpperCase() + getInputs.slice(1);

    try {
        const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${makeFirstUpperCase}&units=metric&appid=${weathertoken}`)

        const currentTemp = Math.ceil(data.main.temp)
        const wind = data.wind.speed;
        const icon = data.weather[0].icon
        const cityName = makeFirstUpperCase
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
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})
            
        interaction.reply({ embeds: [getWeatherEmbed] });

    } catch (error) {
        interaction.reply('Check your inputs, name the city you want to check please.')
    }
};