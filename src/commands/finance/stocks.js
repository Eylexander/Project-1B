const { SlashCommandBuilder, InteractionContextType, AttachmentBuilder } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const users = require('../../game/users');
const stocks = require('../../game/stocks');
const progress = require('../../game/progress');
const { parseAmount } = require('../../game/amount');
const { money, cents, pct, sparkline, relative, num } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const charts = require('../../ui/charts');
const theme = require('../../ui/theme');

function sample(values, count) {
    if (values.length <= count) return values;
    return Array.from({ length: count }, (_, i) => values[Math.round((i * (values.length - 1)) / (count - 1))]);
}

const arrow = (change) => (change > 0.0005 ? '🟢' : change < -0.0005 ? '🔴' : '⚪');

function marketCard() {
    const card = new Card({ title: 'Discord Street Exchange', emoji: '🏛️', subtitle: 'Prices move every 5 minutes · change since midnight UTC', color: theme.finance });
    card.lines(stocks.all().sort((a, b) => b.change - a.change).map((s) =>
        `${arrow(s.change)} **\`${s.symbol.padEnd(4)}\`** ${s.def.emoji} ${cents(s.price)} · ${pct(s.change)} \`${sparkline(sample(stocks.history(s.symbol, 36), 12))}\``));
    const news = stocks.latestNews(3);
    if (news.length) {
        card.divider().text('**📰 Latest news**');
        card.lines(news.map((n) => `${n.change > 0 ? '📈' : '📉'} \`${n.symbol}\` ${n.headline} (${pct(n.change)}) · ${relative(n.created_at)}`));
    }
    return card.footer(`Trading fee ${pct(stocks.FEE, { sign: false, digits: 1 })} · /stocks view for charts · /stocks buy to invest`);
}

/** The stock card, plus a rendered chart file when canvas is available. */
function viewCard(stock, userId) {
    const day = stocks.history(stock.symbol, 288);
    const high = Math.max(...day);
    const low = Math.min(...day);
    const owned = stocks.holding(userId, stock.symbol);
    const chart = charts.stockChart(day, { symbol: stock.symbol, name: stock.def.name });
    const card = new Card({ title: `${stock.def.name} (${stock.symbol})`, emoji: stock.def.emoji, subtitle: `${stock.def.sector}`, color: stock.change >= 0 ? theme.success : theme.danger })
        .lines([
            `## ${cents(stock.price)} ${arrow(stock.change)} ${pct(stock.change)} today`,
            chart ? null : `\`${sparkline(sample(day, 32))}\``,
        ]);
    if (chart) card.image('attachment://chart.png');
    card.text(`-# last 24h · high ${cents(high)} · low ${cents(low)}`);
    if (owned.shares) {
        const value = Math.floor((owned.shares * stock.price) / 100);
        const profit = Math.floor((owned.shares * stock.price - owned.cost) / 100);
        card.divider().text(`💼 You own **${num(owned.shares)}** shares worth **${money(value)}** (${profit >= 0 ? '+' : ''}${money(profit)})`);
    }
    const news = stocks.latestNews(3, stock.symbol);
    if (news.length) card.divider().lines(news.map((n) => `${n.change > 0 ? '📈' : '📉'} ${n.headline} (${pct(n.change)}) · ${relative(n.created_at)}`));
    return { card, files: chart ? [new AttachmentBuilder(chart, { name: 'chart.png' })] : [] };
}

function portfolioCard(user) {
    const rows = stocks.portfolio(user.id);
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    const profit = rows.reduce((sum, r) => sum + r.profit, 0);
    const card = new Card({ title: `${user.username}'s portfolio`, emoji: '💼', subtitle: `Worth ${money(total)} · ${profit >= 0 ? '+' : ''}${money(profit)} all-time`, color: theme.finance });
    if (!rows.length) return card.text('No shares yet. Check `/stocks market` and buy something!');
    return card.lines(rows.map((r) => `${r.def.emoji} **${r.symbol}** ×${num(r.shares)} · ${money(r.value)} · ${r.profit >= 0 ? '🟢 +' : '🔴 '}${money(r.profit)} (${pct(r.cost ? (r.shares * r.price) / r.cost - 1 : 0)})`));
}

const symbolOption = (o) => o.setName('symbol').setDescription('Ticker, e.g. PTAT').setRequired(true).setAutocomplete(true);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stocks')
        .setDescription('Trade on the Discord Street Exchange.')
        .addSubcommand((s) => s.setName('market').setDescription('All stocks at a glance.'))
        .addSubcommand((s) => s.setName('view').setDescription('Chart and news for one stock.').addStringOption(symbolOption))
        .addSubcommand((s) => s.setName('buy').setDescription('Buy shares.').addStringOption(symbolOption)
            .addStringOption((o) => o.setName('shares').setDescription('Number of shares, or "max"').setRequired(true)))
        .addSubcommand((s) => s.setName('sell').setDescription('Sell shares.').addStringOption(symbolOption)
            .addStringOption((o) => o.setName('shares').setDescription('Number of shares, "half" or "all"').setRequired(true)))
        .addSubcommand((s) => s.setName('portfolio').setDescription('Your shares and profit.')
            .addUserOption((o) => o.setName('user').setDescription("Someone else's portfolio")))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        await interaction.respond(stocks.all()
            .filter((s) => !focused || s.symbol.toLowerCase().includes(focused) || s.def.name.toLowerCase().includes(focused))
            .map((s) => ({ name: `${s.def.emoji} ${s.symbol} · ${s.def.name} · ${cents(s.price)} (${pct(s.change)})`, value: s.symbol })));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const sub = interaction.options.getSubcommand();

        if (sub === 'market') return interaction.reply(payload(marketCard().notices(player.welcome(user))));
        if (sub === 'view') {
            const { card, files } = viewCard(stocks.find(interaction.options.getString('symbol', true)), user.id);
            return interaction.reply(payload(card, { files }));
        }
        if (sub === 'portfolio') {
            const other = interaction.options.getUser('user');
            return interaction.reply(payload(portfolioCard(other && other.id !== user.id ? player.target(other) : user)));
        }

        const stock = stocks.find(interaction.options.getString('symbol', true));
        if (sub === 'buy') {
            const max = stocks.affordable(stock, user.wallet);
            if (max < 1) throw new GameError(`One ${stock.symbol} share costs ${cents(stock.price)} (+fee). Your wallet has ${money(user.wallet)}.`, { title: 'Not enough money', emoji: '💸' });
            const shares = parseAmount(interaction.options.getString('shares', true), { available: max, label: 'number of shares' });
            const result = stocks.buy(user.id, stock.symbol, shares);
            const notices = progress.after(user.id, { xp: 10, events: { stock_trade: 1 } });
            return interaction.reply(payload(new Card({ title: 'Order filled', emoji: '📈', color: theme.success })
                .text(`Bought **${num(shares)}** ${stock.def.emoji} **${stock.symbol}** at ${cents(stock.price)} for **${money(result.total)}** (fee ${money(result.fee)}).`)
                .footer(`Wallet: ${money(users.get(user.id).wallet)}`)
                .notices(notices)));
        }

        const owned = stocks.holding(user.id, stock.symbol).shares;
        if (!owned) throw new GameError(`You don't own any ${stock.symbol}.`, { emoji: '📉' });
        const shares = parseAmount(interaction.options.getString('shares', true), { available: owned, label: 'number of shares' });
        const result = stocks.sell(user.id, stock.symbol, shares);
        const notices = progress.after(user.id, { xp: 10, events: { stock_trade: 1 } });
        await interaction.reply(payload(new Card({ title: 'Order filled', emoji: '📉', color: result.profit >= 0 ? theme.success : theme.danger })
            .text(`Sold **${num(shares)}** ${stock.def.emoji} **${stock.symbol}** at ${cents(stock.price)} for **${money(result.total)}** (fee ${money(result.fee)}).`)
            .text(`${result.profit >= 0 ? '🟢 Profit' : '🔴 Loss'}: **${money(result.profit)}**`)
            .notices(notices)));
    },
};
