const { SlashCommandBuilder, InteractionContextType, version: djsVersion } = require('discord.js');
const fs = require('node:fs');
const os = require('node:os');
const config = require('../../config');
const registry = require('../../core/registry');
const { q } = require('../../db');
const { num, duration, compact } = require('../../game/format');
const { Card, payload, linkButton } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('About Project 1B: stats, uptime and a bit of history.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const { client } = interaction;
        const members = client.guilds.cache.reduce((sum, g) => sum + (g.memberCount ?? 0), 0);
        const players = q('SELECT COUNT(*) AS c, COALESCE(SUM(wallet + bank), 0) AS cash FROM users').get();
        const transactions = q('SELECT COUNT(*) AS c FROM transactions').get().c;
        const dbSize = fs.existsSync(config.dbPath) ? fs.statSync(config.dbPath).size : 0;
        const memory = process.memoryUsage().rss;

        await interaction.reply(payload(new Card({ title: config.botName, emoji: '🤖', subtitle: `v${config.version} · The race to $1B`, thumbnail: client.user.displayAvatarURL({ extension: 'png', size: 256 }), color: theme.brand })
            .lines([
                `🌐 **${num(client.guilds.cache.size)}** servers · **${num(members)}** members`,
                `👥 **${num(players.c)}** players · **${compact(players.cash)}** in circulation · **${num(transactions)}** transactions`,
                `⌨️ **${registry.commands.size}** slash commands`,
                `⏱️ Up for **${duration(client.uptime ?? 0)}** · 📡 ${Math.round(client.ws.ping)}ms`,
                `🧠 ${Math.round(memory / 1024 / 1024)} MB RAM · 💾 ${(dbSize / 1024 / 1024).toFixed(1)} MB database`,
                `🛠️ Node ${process.version} · discord.js ${djsVersion} · ${os.platform()}`,
            ])
            .divider()
            .lines([
                '**History**',
                '2018 · born as a first JavaScript project, learning discord.js',
                '2021 · on GitHub, first SQLite database',
                '2022 · discord.js v14, slash commands, jobs, mana: the first economy',
                '2026 · v2: the race to the first billion',
            ])
            .buttons(linkButton('https://github.com/Eylexander/Project-1B', 'GitHub', '🐙'))));
    },
};
