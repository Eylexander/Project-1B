const Discord = require('discord.js');

module.exports = {
    name : "clear",
    description : "To clear chat",
    aliases : ['clean','delete'],
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send("You need `manage_messages` permission to execute this command.");
        if(!args[0]) return message.channel.send("You need to enter an amount.");
        message.channel.bulkDelete((args[0])).then(() => {
            message.channel.send(`Cleared ${args[0]} messages.`)
                .then(message => {
                    setTimeout(() => {
                        message.delete();
                    }, 2500);
                });
        });
    }
};