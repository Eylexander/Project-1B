const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q } = require('../../db');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const networth = require('../../game/networth');
const stats = require('../../game/stats');
const achievements = require('../../game/achievements');
const { compact, num } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

// v1 had `+compare` (alias `flex`). This is that idea, finished.
function snapshot(user) {
    const worth = networth.breakdown(user.id);
    return {
        user,
        rows: [
            ['📊 Net worth', worth.total, compact],
            ['💵 Wallet', user.wallet, compact],
            ['🏦 Bank', user.bank, compact],
            ['📈 Stocks', worth.stocks, compact],
            ['⭐ Level', user.level, num],
            ['♾️ Prestige', user.prestige, num],
            ['🏢 Businesses', q('SELECT COUNT(*) AS c FROM businesses WHERE user_id = ?').get(user.id).c, num],
            ['👔 Shifts worked', stats.get(user.id, 'work'), num],
            ['🎣 Fish caught', stats.get(user.id, 'fish_catch'), num],
            ['🎰 Casino wins', stats.get(user.id, 'gamble_win'), num],
            ['🏅 Achievements', achievements.unlocked(user.id).length, num],
            ['🔥 Best daily streak', stats.get(user.id, 'daily_streak'), num],
        ],
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flex')
        .setDescription('Compare yourself with another player, stat by stat.')
        .addUserOption((o) => o.setName('user').setDescription('Who to flex on').setRequired(true))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const me = player.self(interaction);
        const otherUser = interaction.options.getUser('user', true);
        if (otherUser.id === me.id) throw new GameError('Flexing on yourself in the mirror? Pick someone else.', { emoji: '🪞' });
        const other = player.target(otherUser);
        const a = snapshot(me);
        const b = snapshot(other);

        let scoreA = 0;
        let scoreB = 0;
        const lines = a.rows.map(([label, valueA, fmt], i) => {
            const valueB = b.rows[i][1];
            if (valueA > valueB) scoreA++;
            if (valueB > valueA) scoreB++;
            const left = `${valueA > valueB ? '🟩' : valueA === valueB ? '⬜' : '🟥'} **${fmt(valueA)}**`;
            const right = `**${fmt(valueB)}** ${valueB > valueA ? '🟩' : valueA === valueB ? '⬜' : '🟥'}`;
            return `${left} · ${label} · ${right}`;
        });
        const verdict = scoreA === scoreB ? "It's a tie. Respect." : `**${scoreA > scoreB ? me.username : other.username}** wins ${Math.max(scoreA, scoreB)}-${Math.min(scoreA, scoreB)}. 💪`;

        await interaction.reply(payload(new Card({ title: `${me.username} vs ${other.username}`, emoji: '💪', color: theme.progress })
            .lines(lines)
            .divider()
            .text(verdict)));
    },
};
