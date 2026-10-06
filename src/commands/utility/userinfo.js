const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const users = require('../../game/users');
const networth = require('../../game/networth');
const { timestamp, compact } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription("Someone's Discord account info.")
        .addUserOption((o) => o.setName('user').setDescription('Who (default: you)'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const target = interaction.options.getUser('user') ?? interaction.user;
        const member = interaction.guild ? await interaction.guild.members.fetch(target.id).catch(() => null) : null;
        const playerRow = users.get(target.id);
        const roles = member ? member.roles.cache.filter((r) => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position).map((r) => `<@&${r.id}>`) : [];

        const card = new Card({ title: users.displayName(target), emoji: target.bot ? '🤖' : '👤', subtitle: `@${target.username}`, thumbnail: target.displayAvatarURL({ extension: 'png', size: 256 }), color: member?.displayColor || theme.info })
            .lines([
                `🆔 \`${target.id}\``,
                `📅 Account created ${timestamp(target.createdTimestamp, 'D')} (${timestamp(target.createdTimestamp, 'R')})`,
                member?.joinedTimestamp ? `📥 Joined this server ${timestamp(member.joinedTimestamp, 'D')} (${timestamp(member.joinedTimestamp, 'R')})` : null,
                roles.length ? `🎭 Roles: ${roles.slice(0, 15).join(' ')}${roles.length > 15 ? ` +${roles.length - 15}` : ''}` : null,
                playerRow ? `💰 Project 1B: level ${playerRow.level}, net worth ${compact(networth.total(target.id))}${playerRow.legacy ? ' · 🎖️ OG' : ''}` : '💰 Not playing Project 1B (yet)',
            ]);
        await interaction.reply(payload(card));
    },
};
