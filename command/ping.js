const Discord = require('discord.js');

module.exports = {
    name : "ping",
    description: 'Ping command',
    async execute(client, message, args) {
        message.reply(`Pong! Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`);
    }
};