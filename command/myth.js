const Discord = require('discord.js');

module.exports = {
    name : "mythologie",
    description : 'Teaches you Mythologie.',
    aliases : ['myth'],
    async execute(client, message, args) {
        message.channel.send("Working on it ...");
    }
};