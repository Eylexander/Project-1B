const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q, tx } = require('../../db');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const economy = require('../../game/economy');
const inventory = require('../../game/inventory');
const progress = require('../../game/progress');
const { DAY } = require('../../game/formulas');
const { money, relative, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

const CLAIM_EVERY = 7 * DAY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weekly')
        .setDescription('Claim your weekly paycheck and an Iron Chest.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const now = Date.now();
        if (user.weekly_at && now - user.weekly_at < CLAIM_EVERY) {
            throw new GameError(`Your next weekly reward is ready ${relative(user.weekly_at + CLAIM_EVERY)}.`, { title: 'Weekly reward', emoji: '🗓️' });
        }
        const reward = 10_000 + user.level * 1_500;
        tx(() => {
            q('UPDATE users SET weekly_at = ? WHERE id = ?').run(now, user.id);
            economy.credit(user.id, reward, 'weekly', 'Weekly reward');
            inventory.add(user.id, 'rare_chest', 1);
        });
        const notices = progress.after(user.id, { xp: 300 });
        await interaction.reply(payload(new Card({ title: 'Weekly reward', emoji: '🗓️', color: theme.success })
            .lines([`You received **${money(reward)}** and an ${itemLabel(inventory.item('rare_chest'))}!`, 'Open it with `/use`.'])
            .footer(`Next claim ${relative(now + CLAIM_EVERY)}`)
            .notices([...player.welcome(user), ...notices])));
    },
};
