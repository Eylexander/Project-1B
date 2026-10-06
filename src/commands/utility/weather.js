const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const axios = require('axios');
const config = require('../../config');
const { GameError } = require('../../core/errors');
const { Card, edit } = require('../../ui/card');
const { loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Current weather anywhere (OpenWeatherMap).')
        .addStringOption((o) => o.setName('city').setDescription('e.g. Paris, Troyes, Tokyo').setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        if (!config.weatherToken) throw new GameError('Weather is not configured on this bot ("weathertoken" in settings.json).');
        const city = interaction.options.getString('city', true);
        await loading(interaction, `Checking the sky over ${city}…`);
        let data;
        try {
            ({ data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
                params: { q: city, units: 'metric', appid: config.weatherToken },
                timeout: 8_000,
            }));
        } catch {
            throw new GameError(`I couldn't find the weather for **${city}**. Check the spelling?`, { emoji: '🌫️' });
        }
        const { temp, feels_like: feels, temp_min: min, temp_max: max, humidity, pressure } = data.main;
        await interaction.editReply(edit(new Card({
            title: `${data.name}, ${data.sys.country}`,
            emoji: '🌤️',
            subtitle: data.weather[0].description,
            thumbnail: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
            color: theme.info,
        }).lines([
            `## ${Math.round(temp)}°C`,
            `Feels like ${Math.round(feels)}°C · min ${Math.round(min)}°C · max ${Math.round(max)}°C`,
            `💧 ${humidity}% humidity · 💨 ${data.wind.speed} m/s wind · 🧭 ${pressure} hPa`,
            `🗺️ [Open the map](https://www.openstreetmap.org/#map=12/${data.coord.lat}/${data.coord.lon})`,
        ])));
    },
};
