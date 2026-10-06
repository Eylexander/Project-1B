const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const logger = require('./core/logger');
const registry = require('./core/registry');
const db = require('./db');

if (!config.token) {
    logger.error('No bot token. Put it in settings.json ("token") or the DISCORD_TOKEN environment variable.');
    process.exit(1);
}

db.db(); // opens the database and runs migrations (including the v1 import on first boot)
registry.load();
logger.info(`Loaded ${registry.commands.size} commands.`);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],
});

const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'))) {
    const event = require(path.join(eventsDir, file));
    const handler = (...args) => Promise.resolve(event.execute(client, ...args)).catch((error) => logger.error(`Event ${event.name} failed:`, error));
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
}

process.on('unhandledRejection', (error) => logger.error('Unhandled rejection:', error));

function shutdown(signal) {
    logger.info(`${signal} received, shutting down.`);
    client.destroy().finally(() => {
        db.close();
        process.exit(0);
    });
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

client.login(config.token).catch((error) => {
    logger.error('Could not log in to Discord:', error.message);
    db.close();
    process.exit(1);
});

module.exports = client;
