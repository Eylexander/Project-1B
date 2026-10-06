const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q } = require('../../db');
const player = require('../../core/player');
const networth = require('../../game/networth');
const { money, compact, num } = require('../../game/format');
const { Card } = require('../../ui/card');
const { paginate } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const PER_PAGE = 10;
const KINDS = {
    networth: { name: 'Net worth', emoji: '📊', show: (r) => money(r.networth) },
    wallet: { name: 'Wallet', emoji: '💵', show: (r) => money(r.score) },
    bank: { name: 'Bank', emoji: '🏦', show: (r) => money(r.score) },
    level: { name: 'Level', emoji: '⭐', show: (r) => `Level ${r.level}` },
    prestige: { name: 'Prestige', emoji: '♾️', show: (r) => `Prestige ${r.prestige} · ${compact(r.networth)}` },
    earned: { name: 'Lifetime earnings', emoji: '💹', show: (r) => money(r.score) },
};
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Who is closest to the first billion?')
        .addStringOption((o) => o.setName('by').setDescription('What to rank by')
            .addChoices(...Object.entries(KINDS).map(([value, k]) => ({ name: `${k.emoji} ${k.name}`, value }))))
        .addStringOption((o) => o.setName('scope').setDescription('Everyone, or just this server')
            .addChoices({ name: '🌍 Global', value: 'global' }, { name: '🏠 This server', value: 'server' }))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const kind = interaction.options.getString('by') ?? 'networth';
        const scope = interaction.guildId ? interaction.options.getString('scope') ?? 'global' : 'global';
        const ids = scope === 'server'
            ? q('SELECT user_id FROM guild_players WHERE guild_id = ?').all(interaction.guildId).map((r) => r.user_id)
            : null;
        const total = networth.count(ids);
        const pages = Math.max(1, Math.ceil(total / PER_PAGE));
        const myRank = networth.rankOf(me.id, kind, ids);
        const def = KINDS[kind];

        await paginate(interaction, (page) => {
            const rows = networth.ranking(kind, { ids, limit: PER_PAGE, offset: page * PER_PAGE });
            const card = new Card({
                title: `${def.name} leaderboard`,
                emoji: def.emoji,
                subtitle: scope === 'server' ? `${interaction.guild?.name ?? 'This server'} · ${num(total)} players` : `Global · ${num(total)} players`,
                color: theme.progress,
            });
            if (!rows.length) card.text('Nobody here yet. Be the first: `/daily`!');
            card.lines(rows.map((row, i) => {
                const position = page * PER_PAGE + i + 1;
                const badge = `${row.legacy ? ' 🎖️' : ''}${row.prestige ? ` ${'★'.repeat(Math.min(row.prestige, 5))}` : ''}`;
                const you = row.id === me.id ? ' ← you' : '';
                return `${MEDALS[position - 1] ?? `\`#${position}\``} **${row.username}**${badge} · ${def.show(row)}${you}`;
            }));
            card.footer(myRank ? `Your rank: #${myRank}` : scope === 'server' ? 'Use a command in this server to appear here.' : null);
            return card;
        }, { pages });
    },
};
