const { Events } = require('discord.js');
const logger = require('../core/logger');
const guilds = require('../game/guilds');

module.exports = {
    name: Events.GuildCreate,
    execute(client, guild) {
        guilds.settings(guild.id, guild.name);
        logger.ok(`Joined a new server: ${guild.name} (${guild.memberCount} members)`);
    },
};
