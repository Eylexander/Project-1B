const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const axios = require('axios');
const { GameError } = require('../../core/errors');
const { pct } = require('../../game/format');
const { Card, edit } = require('../../ui/card');
const { loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Real-world crypto prices from CoinGecko. (For in-game crypto, see 1BC in /stocks.)')
        .addStringOption((o) => o.setName('coin').setDescription('CoinGecko id, e.g. bitcoin, ethereum, solana').setRequired(true))
        .addStringOption((o) => o.setName('currency').setDescription('e.g. usd, eur (default usd)'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const coin = interaction.options.getString('coin', true).toLowerCase().trim();
        const currency = (interaction.options.getString('currency') ?? 'usd').toLowerCase().trim();
        await loading(interaction, `Asking CoinGecko about ${coin}…`);
        let price;
        let change;
        try {
            const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: { ids: coin, vs_currencies: currency, include_24hr_change: true },
                timeout: 8_000,
            });
            price = data?.[coin]?.[currency];
            change = data?.[coin]?.[`${currency}_24h_change`];
        } catch {
            throw new GameError('CoinGecko did not answer. Try again in a minute.', { emoji: '📡' });
        }
        if (price === undefined) throw new GameError(`No price for **${coin}** in **${currency.toUpperCase()}**. Use the CoinGecko id (e.g. \`bitcoin\`).`, { emoji: '🪙' });

        const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase(), maximumSignificantDigits: 8 }).format(price);
        await interaction.editReply(edit(new Card({ title: coin, emoji: '🪙', subtitle: 'CoinGecko', color: change >= 0 ? theme.success : theme.danger })
            .lines([
                `## ${formatted}`,
                change !== undefined && change !== null ? `${change >= 0 ? '🟢' : '🔴'} ${pct(change / 100)} in 24h` : null,
                `[View on CoinGecko](https://www.coingecko.com/en/coins/${encodeURIComponent(coin)})`,
            ])));
    },
};
