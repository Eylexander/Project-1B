const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const settingsPath = path.join(root, 'settings.json');
const settings = fs.existsSync(settingsPath)
    ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    : {};

const token = process.env.DISCORD_TOKEN || settings.token || '';

// The first segment of a bot token is the base64-encoded application id,
// so the deploy script works without asking for one more setting.
function clientIdFromToken(value) {
    try {
        return Buffer.from(value.split('.')[0], 'base64').toString('utf8');
    } catch {
        return null;
    }
}

module.exports = {
    root,
    token,
    clientId: process.env.CLIENT_ID || settings.clientId || clientIdFromToken(token),
    ownerId: settings.admin || '',
    devGuildId: settings.devserver || '',
    weatherToken: settings.weathertoken || '',
    newsApiKey: settings.newsapi || '',
    botName: settings.bot_info?.name || 'Project 1B',
    version: require('../package.json').version,
    dbPath: process.env.P1B_DB || path.join(root, 'database', 'project1b.sqlite'),
    legacyDir: path.join(root, 'database'),
    logsDir: path.join(root, 'logs'),
    // 'guild' syncs slash commands to the dev server on boot, 'global' everywhere, 'off' never.
    deployOnStart: settings.deployOnStart || 'guild',
};
