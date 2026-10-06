const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q } = require('../../db');
const { timestamp, num, compact } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('About this server, and how it is doing in Project 1B.')
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const guild = await interaction.guild.fetch();
        const owner = await guild.fetchOwner().catch(() => null);
        const players = q(`
            SELECT COUNT(*) AS c, COALESCE(SUM(u.wallet + u.bank), 0) AS cash
            FROM guild_players g JOIN users u ON u.id = g.user_id WHERE g.guild_id = ?
        `).get(guild.id);
        const icon = guild.iconURL({ extension: 'png', size: 256 });

        await interaction.reply(payload(new Card({ title: guild.name, emoji: '🏠', subtitle: guild.description ?? undefined, thumbnail: icon ?? undefined, color: theme.info })
            .lines([
                owner ? `👑 Owner: ${owner.user.username}` : null,
                `📅 Created ${timestamp(guild.createdTimestamp, 'D')} (${timestamp(guild.createdTimestamp, 'R')})`,
                `👥 ${num(guild.memberCount)} members · 💬 ${num(guild.channels.cache.size)} channels · 🎭 ${num(guild.roles.cache.size)} roles`,
                guild.premiumSubscriptionCount ? `🚀 ${guild.premiumSubscriptionCount} boosts (tier ${guild.premiumTier})` : null,
                `💰 ${num(players.c)} Project 1B players here holding ${compact(players.cash)}`,
            ])));
    },
};
