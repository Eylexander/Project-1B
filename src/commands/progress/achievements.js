const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const achievements = require('../../game/achievements');
const stats = require('../../game/stats');
const networth = require('../../game/networth');
const { money, num, compact, relative } = require('../../game/format');
const { Card } = require('../../ui/card');
const { paginate } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const PER_PAGE = 10;

function progressText(a, user, values, worth) {
    if (a.stat) return `${num(Math.min(values[a.stat] ?? 0, a.threshold))}/${num(a.threshold)}`;
    if (a.level) return `level ${Math.min(user.level, a.level)}/${a.level}`;
    if (a.networth) return `${compact(Math.min(worth, a.networth))}/${compact(a.networth)}`;
    if (a.prestige) return `${Math.min(user.prestige, a.prestige)}/${a.prestige}`;
    return 'secret';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('Badges you have earned and the ones still waiting.')
        .addUserOption((o) => o.setName('user').setDescription("Someone else's badges"))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const other = interaction.options.getUser('user');
        const user = other && other.id !== me.id ? player.target(other) : me;
        const unlocked = new Map(achievements.unlocked(user.id).map((a) => [a.id, a]));
        const values = stats.all(user.id);
        const worth = networth.total(user.id);
        // Unlocked first, then by how close they are.
        const all = achievements.list
            .filter((a) => !a.special || unlocked.has(a.id))
            .sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)));
        const pages = Math.ceil(all.length / PER_PAGE);

        await paginate(interaction, (page) => {
            const card = new Card({ title: `${user.username}'s achievements`, emoji: '🏆', subtitle: `${unlocked.size}/${all.length} unlocked`, color: theme.progress });
            card.lines(all.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map((a) => {
                const got = unlocked.get(a.id);
                return got
                    ? `${a.emoji} **${a.name}** · ${a.description} · ✅ ${relative(got.unlockedAt)}`
                    : `🔒 **${a.name}** · ${a.description} · ${progressText(a, user, values, worth)}${a.reward ? ` · ${money(a.reward)}` : ''}`;
            }));
            return card;
        }, { pages });
    },
};
