const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q } = require('../../db');
const player = require('../../core/player');
const { money, relative } = require('../../game/format');
const { Card } = require('../../ui/card');
const { paginate } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const PER_PAGE = 12;
const ICONS = {
    work: '👔', sell: '🏷️', buy: '🛒', daily: '📅', weekly: '🗓️', business: '🏢', business_buy: '🏢', business_upgrade: '🏢',
    interest: '📈', quest: '🎯', achievement: '🏆', levelup: '⬆️', chest: '📦', rob: '🦹', robbed: '🦹', fine: '🚔',
    compensation: '⚖️', heist: '💰', bet: '🎰', gamble: '🎰', lottery: '🎟️', lottery_ticket: '🎟️', market_sale: '🏪',
    market_buy: '🏪', market_fee: '🏪', stock_buy: '📊', stock_sell: '📊', pay_in: '🤝', pay_out: '🤝', deposit: '🏦',
    withdraw: '🏦', chat: '💬', legacy: '🎖️', starter: '👋', prestige: '♾️', prestige_bonus: '♾️', admin: '👑',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transactions')
        .setDescription('Your bank statement: every dollar in and out.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        // Moving money between your own wallet and bank isn't interesting on a statement.
        const where = "user_id = ? AND type NOT IN ('deposit', 'withdraw')";
        const total = q(`SELECT COUNT(*) AS c FROM transactions WHERE ${where}`).get(user.id).c;
        const pages = Math.max(1, Math.ceil(total / PER_PAGE));
        const day = q(`SELECT COALESCE(SUM(CASE WHEN amount > 0 THEN amount END), 0) AS income, COALESCE(SUM(CASE WHEN amount < 0 THEN amount END), 0) AS spent FROM transactions WHERE ${where} AND created_at > ?`)
            .get(user.id, Date.now() - 24 * 60 * 60 * 1000);

        await paginate(interaction, (page) => {
            const rows = q(`SELECT * FROM transactions WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(user.id, PER_PAGE, page * PER_PAGE);
            return new Card({ title: 'Bank statement', emoji: '🧾', subtitle: `Last 24h: +${money(day.income)} / ${money(day.spent)}`, color: theme.finance })
                .lines(rows.length ? rows.map((t) => `${ICONS[t.type] ?? '•'} ${t.amount > 0 ? '🟢' : '🔴'} **${t.amount > 0 ? '+' : ''}${money(t.amount)}** ${t.detail ? `· ${t.detail}` : `· ${t.type}`} · ${relative(t.created_at)}`) : ['No transactions yet.']);
        }, { pages, ephemeral: true });
    },
};
