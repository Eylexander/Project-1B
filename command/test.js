const Discord = require('discord.js');

module.exports = {
    name : "test",
    description: 'Pong command',
    aliases : ['tst','try'],
    async execute(client, message, args) {
        message.channel.send("Ping!");
    },
};