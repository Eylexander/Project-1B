const Discord = require('discord.js');

module.exports = {
    name : "clear",
    description : "To clear chat",
    aliases : ['clean'],
    async execute(client, message, args) {
        if(!args[0]) return message.channel.send("gros con");
        message.channel.bulkDelete(args[0]).then(() => {
            message.channel.send(`Cleared ${args[0]} messages.`).then(message => message.delete(5000));
        });
    }
};