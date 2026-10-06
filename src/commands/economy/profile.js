const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const users = require('../../game/users');
const jobs = require('../../game/jobs');
const networth = require('../../game/networth');
const achievements = require('../../game/achievements');
const boosts = require('../../game/boosts');
const stats = require('../../game/stats');
const { q } = require('../../db');
const F = require('../../game/formulas');
const { money, compact, bar, num, relative, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

function profileCard(user, discordUser) {
    const worth = networth.breakdown(user.id);
    const rank = networth.rankOf(user.id);
    const energy = users.energyInfo(user);
    const { job, tier } = jobs.jobOf(user);
    const need = F.xpForNext(user.level);
    const capacity = F.bankCapacity(user);
    const unlocked = achievements.unlocked(user.id);
    const businessCount = q('SELECT COUNT(*) AS c FROM businesses WHERE user_id = ?').get(user.id).c;
    const active = boosts.list(user.id);
    const shifts = stats.get(user.id, 'work');

    const tags = [
        user.legacy ? '🎖️ OG' : null,
        user.prestige ? `${'★'.repeat(Math.min(user.prestige, 5))} Prestige ${user.prestige}` : null,
        rank ? `#${rank} global` : null,
        user.passive ? '🕊️ Passive' : null,
    ].filter(Boolean);

    const card = new Card({
        title: user.username,
        emoji: '💼',
        subtitle: tags.join(' · ') || 'Rookie',
        thumbnail: player.avatar(discordUser),
        color: user.prestige ? theme.progress : theme.brand,
    });

    card.lines([
        `💵 **Wallet** ${money(user.wallet)}`,
        `🏦 **Bank** ${money(user.bank)} / ${money(capacity)}${user.bank > capacity ? ' *(over capacity, extra earns no interest)*' : ''}`,
        `📈 **Stocks** ${money(worth.stocks)} · 🏢 **Businesses** ${businessCount} (${compact(worth.businesses)})`,
        `📊 **Net worth** ${money(worth.total)}`,
    ]);
    card.divider();
    card.lines([
        `**Project 1B** · ${pct(worth.total / F.BILLION, { sign: false, digits: 3 })} of the first billion`,
        bar(worth.total / F.BILLION, 16),
    ]);
    card.divider();
    card.lines([
        `⭐ **Level ${user.level}** · ${num(user.xp)} / ${num(need)} XP`,
        bar(user.xp / need, 16),
        `⚡ **Energy** ${energy.energy} / ${energy.max}${energy.fullAt ? ` · full ${relative(energy.fullAt)}` : ''}`,
        `${job.emoji} **${job.name}** · ${tier.title} · ${num(shifts)} shifts worked`,
        active.length ? `✨ **Boosts** ${active.map((b) => `${b.emoji} ${b.name} (ends ${relative(b.expiresAt)})`).join(', ')}` : null,
    ]);
    if (unlocked.length) {
        card.divider();
        card.text(`🏅 **Badges** (${unlocked.length}/${achievements.list.length}) ${unlocked.slice(-16).map((a) => a.emoji).join(' ')}`);
    }
    card.footer(`Playing since ${relative(user.created_at)} · lifetime earnings ${compact(user.lifetime_earned)}`);
    return card;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Your profile: money, level, energy, job and badges.')
        .addUserOption((o) => o.setName('user').setDescription('Look at someone else'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const other = interaction.options.getUser('user');
        const user = other && other.id !== me.id ? player.target(other) : me;
        const card = profileCard(user, other ?? interaction.user).notices(player.welcome(me));
        await interaction.reply(payload(card));
    },

    profileCard,
};
