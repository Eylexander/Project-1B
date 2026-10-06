const { Events } = require('discord.js');
const router = require('../core/router');

module.exports = {
    name: Events.InteractionCreate,
    execute(client, interaction) {
        return router.handle(interaction);
    },
};
