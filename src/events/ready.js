const { Events } = require('discord.js');
const chalk = require('chalk');
const config = require('../config');
const logger = require('../core/logger');
const { deploy, fingerprint } = require('../core/deploy');
const mentions = require('../core/mentions');
const scheduler = require('../core/scheduler');
const state = require('../game/state');
const stocks = require('../game/stocks');
const lottery = require('../game/lottery');

async function syncCommands(client) {
    const scope = config.deployOnStart;
    if (scope === 'off') return;
    const print = `${scope}:${fingerprint()}`;
    if (state.get('deployed_commands') === print) {
        logger.info('Slash commands are up to date.');
        return;
    }
    try {
        const results = await deploy(scope, { rest: client.rest });
        for (const [where, list] of Object.entries(results)) logger.ok(`Deployed ${list.length} slash command(s) → ${where}`);
        state.set('deployed_commands', print);
    } catch (error) {
        logger.error('Could not deploy slash commands:', error);
    }
}

async function cacheCommandIds(client) {
    try {
        mentions.remember(await client.application.commands.fetch());
        if (config.devGuildId) {
            const guild = await client.guilds.fetch(config.devGuildId).catch(() => null);
            if (guild) mentions.remember(await guild.commands.fetch());
        }
    } catch (error) {
        logger.warn('Could not fetch command ids for mentions:', error.message);
    }
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const members = client.guilds.cache.reduce((sum, g) => sum + (g.memberCount ?? 0), 0);
        logger.ok(`${chalk.bold(client.user.tag)} is ${chalk.black.bgGreen(' ON ')} · ${client.guilds.cache.size} servers · ${members} members`);

        stocks.seed();
        lottery.current();
        await syncCommands(client);
        await cacheCommandIds(client);
        scheduler.start(client);
    },
};
