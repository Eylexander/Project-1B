const Discord = require('discord.js');

module.exports = {
    name: "suggestion",
    description: "Add a suggestion to the todo list!",
    aliases: ['suggest', 'sugg'],
    tuto: "[name] [description]",
    async execute(client, message, args) {
        message.channel.send("non")
    }
};