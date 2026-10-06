const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q, tx } = require('../../db');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const economy = require('../../game/economy');
const inventory = require('../../game/inventory');
const progress = require('../../game/progress');
const { HOUR } = require('../../game/formulas');
const { money, relative, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

const CLAIM_EVERY = 20 * HOUR; // a little slack so the daily doesn't drift later every day
const STREAK_WINDOW = 48 * HOUR;

function rewardFor(streak, level) {
    return 1_000 + 150 * Math.min(streak - 1, 30) + level * 100;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward. Come back every day to grow your streak!')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const now = Date.now();
        if (user.daily_at && now - user.daily_at < CLAIM_EVERY) {
            throw new GameError(`You already claimed today. Come back ${relative(user.daily_at + CLAIM_EVERY)}.\nCurrent streak: **${user.daily_streak}** 🔥`, { title: 'Daily reward', emoji: '📅' });
        }
        const kept = user.daily_at && now - user.daily_at <= STREAK_WINDOW;
        const streak = kept ? user.daily_streak + 1 : 1;
        const reward = rewardFor(streak, user.level);
        const bonus = streak % 30 === 0 ? 'legendary_chest' : streak % 7 === 0 ? 'rare_chest' : null;

        tx(() => {
            q('UPDATE users SET daily_at = ?, daily_streak = ? WHERE id = ?').run(now, streak, user.id);
            economy.credit(user.id, reward, 'daily', `Day ${streak}`);
            if (bonus) inventory.add(user.id, bonus, 1);
        });

        const notices = progress.after(user.id, { xp: 60, events: { daily: 1 }, peaks: { daily_streak: streak } });
        const card = new Card({ title: 'Daily reward', emoji: '📅', color: theme.success })
            .lines([
                `You received **${money(reward)}**!`,
                `🔥 Streak: **${streak}** day${streak === 1 ? '' : 's'}${!kept && user.daily_streak > 1 ? ` *(your ${user.daily_streak}-day streak expired)*` : ''}`,
                bonus ? `🎁 Streak bonus: ${itemLabel(inventory.item(bonus))}` : `🎁 Next chest at day ${Math.ceil((streak + 1) / 7) * 7}`,
            ])
            .footer(`Next claim ${relative(now + CLAIM_EVERY)} · keep the streak by claiming within 48h`)
            .notices([...player.welcome(user), ...notices]);
        await interaction.reply(payload(card));
    },
};
