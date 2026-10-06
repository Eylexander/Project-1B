const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const axios = require('axios');
const { GameError } = require('../../core/errors');
const { Card, edit, linkButton } = require('../../ui/card');
const { loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

// The v1 meme collection API first, then a public fallback (safe-for-work posts only).
async function fromCollection() {
    const { data } = await axios.get('https://memes.eylexander.xyz/api/v1/', { timeout: 4_000 });
    return { title: String(data.name), url: data.url, link: data.url };
}

async function fromReddit() {
    for (let attempt = 0; attempt < 3; attempt++) {
        const { data } = await axios.get('https://meme-api.com/gimme', { timeout: 6_000 });
        if (!data.nsfw && !data.spoiler && data.url) return { title: data.title, url: data.url, link: data.postLink, source: `r/${data.subreddit}` };
    }
    throw new Error('No safe meme found');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('A random meme.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        await loading(interaction, 'Finding a fresh meme…');
        let meme = null;
        for (const source of [fromCollection, fromReddit]) {
            meme = await source().catch(() => null);
            if (meme) break;
        }
        if (!meme) throw new GameError('The meme supply chain is broken. Try again later.', { emoji: '🐸' });
        await interaction.editReply(edit(new Card({ title: meme.title.slice(0, 200), emoji: '🐸', subtitle: meme.source, color: theme.items })
            .image(meme.url)
            .buttons(linkButton(meme.link, 'Open', '🔗'))));
    },
};
