const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const axios = require('axios');
const config = require('../../config');
const { GameError } = require('../../core/errors');
const { timestamp } = require('../../game/format');
const { Card, edit, linkButton } = require('../../ui/card');
const { loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('news')
        .setDescription('The latest headline about any topic (NewsAPI).')
        .addStringOption((o) => o.setName('topic').setDescription('Default: crypto'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        if (!config.newsApiKey) throw new GameError('News is not configured on this bot ("newsapi" in settings.json).');
        const topic = interaction.options.getString('topic') ?? 'crypto';
        await loading(interaction, `Looking for news about ${topic}…`);
        let article;
        try {
            const { data } = await axios.get('https://newsapi.org/v2/everything', {
                params: { q: topic, pageSize: 1, sortBy: 'publishedAt', language: 'en', apiKey: config.newsApiKey },
                timeout: 8_000,
            });
            article = data.articles?.[0];
        } catch {
            throw new GameError('NewsAPI did not answer. Try again later.', { emoji: '📡' });
        }
        if (!article) throw new GameError(`No news about **${topic}** right now.`, { emoji: '📰' });

        const card = new Card({ title: article.title.slice(0, 200), emoji: '📰', subtitle: `${article.source?.name ?? 'Unknown source'} · ${timestamp(Date.parse(article.publishedAt), 'R')}`, color: theme.info })
            .text(article.description ?? '');
        if (article.urlToImage) card.image(article.urlToImage);
        card.buttons(linkButton(article.url, 'Read the article', '🔗'));
        await interaction.editReply(edit(card));
    },
};
