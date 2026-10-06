const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const quests = require('../../game/quests');
const { QUESTS, ALL_DONE_REWARD } = require('../../data/quests');
const inventory = require('../../game/inventory');
const { money, bar, num, relative, itemLabel } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

const DIFFICULTY = ['🟢 Easy', '🟡 Medium', '🔴 Hard'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('Your three daily quests. They reset at midnight UTC.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const rows = quests.forToday(user.id);
        const done = rows.filter((r) => r.completed_at).length;
        const card = new Card({ title: 'Daily quests', emoji: '🎯', subtitle: `${done}/${rows.length} done · new quests ${relative(quests.nextReset())}`, color: theme.progress });
        for (const row of rows) {
            const finished = Boolean(row.completed_at);
            const value = QUESTS[row.quest_id].money ? `${money(row.progress)} / ${money(row.target)}` : `${num(row.progress)} / ${num(row.target)}`;
            card.text(`${finished ? '✅' : DIFFICULTY[row.slot]} **${quests.describe(row)}**\n${bar(row.progress / row.target, 12)} ${value} · reward ${money(row.reward_money)} + ${row.reward_xp} XP`);
        }
        card.divider().text(`🌟 Finish all three for a bonus ${itemLabel(inventory.item(ALL_DONE_REWARD.item))}${done === rows.length ? ' · **claimed!**' : ''}`);
        await interaction.reply(payload(card.notices(player.welcome(user))));
    },
};
