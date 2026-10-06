const { SlashCommandBuilder, InteractionContextType, StringSelectMenuBuilder, ApplicationCommandOptionType } = require('discord.js');
const { GameError } = require('../../core/errors');
const registry = require('../../core/registry');
const mentions = require('../../core/mentions');
const config = require('../../config');
const { Card, payload, edit } = require('../../ui/card');
const theme = require('../../ui/theme');

const visibleCategories = () => Object.entries(registry.CATEGORIES).filter(([, c]) => !c.hidden);
const commandsIn = (folder) => [...registry.commands.values()].filter((c) => c.folder === folder);

/** "/job list", "/job apply"... for commands with subcommands, otherwise just "/name". */
function usages(command) {
    const json = command.data.toJSON();
    const subs = (json.options ?? []).filter((o) => o.type === ApplicationCommandOptionType.Subcommand);
    if (!subs.length) return [{ text: mentions.cmd(json.name), description: json.description }];
    return subs.map((s) => ({ text: mentions.cmd(json.name, s.name), description: s.description }));
}

function menu(selected) {
    return new StringSelectMenuBuilder()
        .setCustomId('p1b:help')
        .setPlaceholder('Pick a category')
        .addOptions(
            { label: 'Overview', value: 'home', emoji: '🏠', default: selected === 'home' },
            ...visibleCategories().map(([folder, c]) => ({ label: c.name, value: folder, emoji: c.emoji, description: c.description.slice(0, 100), default: selected === folder })),
        );
}

function homeCard() {
    const card = new Card({ title: `${config.botName} · The race to $1B`, emoji: '💰', subtitle: `v${config.version} · ${registry.commands.size} commands`, color: theme.brand })
        .lines([
            'Started in 2018 as a first JavaScript project, Project 1B is now a full economy game.',
            'Work, fish, mine, trade stocks, build a business empire, gamble (responsibly)... and race everyone to the **first billion**. Get there and you can **prestige** for permanent bonuses.',
        ])
        .divider()
        .lines([
            '**New here? Try this:**',
            `1. ${mentions.cmd('daily')} to grab free money (come back every day for a streak)`,
            `2. ${mentions.cmd('job', 'list')} then ${mentions.cmd('job', 'apply')} to get hired, and ${mentions.cmd('work')}`,
            `3. ${mentions.cmd('shop')} for a 🎣 rod, then ${mentions.cmd('fish')}`,
            `4. ${mentions.cmd('quests')} for today's bonus objectives`,
            `5. ${mentions.cmd('business', 'directory')} to earn while you sleep`,
        ])
        .divider()
        .lines(visibleCategories().map(([folder, c]) => `${c.emoji} **${c.name}** · ${commandsIn(folder).map((cmd) => `\`/${cmd.data.name}\``).join(' ')}`));
    return card.select(menu('home'));
}

function categoryCard(folder) {
    const category = registry.CATEGORIES[folder];
    const card = new Card({ title: category.name, emoji: category.emoji, subtitle: category.description, color: theme.info });
    card.lines(commandsIn(folder).flatMap(usages).map((u) => `${u.text} · ${u.description}`));
    return card.select(menu(folder));
}

function commandCard(command) {
    const json = command.data.toJSON();
    const card = new Card({ title: `/${json.name}`, emoji: command.category.emoji, subtitle: command.category.name, color: theme.info }).text(json.description);
    const lines = [];
    for (const option of json.options ?? []) {
        if (option.type === ApplicationCommandOptionType.Subcommand) {
            const args = (option.options ?? []).map((o) => (o.required ? `<${o.name}>` : `[${o.name}]`)).join(' ');
            lines.push(`${mentions.cmd(json.name, option.name)} ${args ? `\`${args}\`` : ''} · ${option.description}`);
        } else {
            lines.push(`\`${option.required ? `<${option.name}>` : `[${option.name}]`}\` · ${option.description}`);
        }
    }
    if (lines.length) card.divider().lines(lines);
    return card.footer('<required> [optional]');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('How to play, and every command.')
        .addStringOption((o) => o.setName('command').setDescription('Details for one command').setAutocomplete(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        await interaction.respond([...registry.commands.values()]
            .filter((c) => !c.ownerOnly && c.data.name.includes(focused))
            .slice(0, 25)
            .map((c) => ({ name: `/${c.data.name} · ${c.data.description}`.slice(0, 100), value: c.data.name })));
    },

    async execute(interaction) {
        const name = interaction.options.getString('command');
        if (name) {
            const command = registry.commands.get(name.replace(/^\//, '').toLowerCase());
            if (!command || command.ownerOnly) throw new GameError(`There is no \`/${name}\` command.`);
            return interaction.reply(payload(commandCard(command), { ephemeral: true }));
        }
        await interaction.reply(payload(homeCard(), { ephemeral: true }));
    },

    components: {
        async help(interaction) {
            const value = interaction.values[0];
            await interaction.update(edit(value === 'home' ? homeCard() : categoryCard(value)));
        },
    },
};
