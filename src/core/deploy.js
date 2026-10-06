const crypto = require('node:crypto');
const { REST, Routes } = require('discord.js');
const config = require('../config');
const registry = require('./registry');
const logger = require('./logger');

/**
 * Registers slash commands with Discord.
 *   guild:  every command on the dev server only (instant, for testing)
 *   global: public commands everywhere (can take a while to show up) + owner commands on the dev server
 *   clear-global: removes all global commands (e.g. the old v1 ones)
 */
async function deploy(scope = 'guild', { rest = new REST({ version: '10' }).setToken(config.token) } = {}) {
    if (!registry.commands.size) registry.load();
    const { public: publicCommands, owner } = registry.definitions();
    const results = {};

    if (scope === 'guild') {
        if (!config.devGuildId) throw new Error('Set "devserver" in settings.json to deploy to a guild.');
        results.guild = await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), { body: [...publicCommands, ...owner] });
    } else if (scope === 'global') {
        results.global = await rest.put(Routes.applicationCommands(config.clientId), { body: publicCommands });
        if (config.devGuildId) results.guild = await rest.put(Routes.applicationGuildCommands(config.clientId, config.devGuildId), { body: owner });
    } else if (scope === 'clear-global') {
        results.global = await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
    } else {
        throw new Error(`Unknown deploy scope "${scope}" (use guild, global or clear-global)`);
    }
    return results;
}

/** Fingerprint of the command definitions, to skip deploying when nothing changed. */
function fingerprint() {
    if (!registry.commands.size) registry.load();
    return crypto.createHash('sha256').update(JSON.stringify(registry.definitions())).digest('hex').slice(0, 16);
}

if (require.main === module) {
    const scope = process.argv[2] ?? 'guild';
    deploy(scope)
        .then((results) => {
            for (const [where, list] of Object.entries(results)) logger.ok(`Deployed ${list.length} command(s) → ${where}`);
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Deploy failed:', error);
            process.exit(1);
        });
}

module.exports = { deploy, fingerprint };
