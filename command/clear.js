const Discord = require('discord.js');
const client = new Discord.Client();

module.exports = {
    name : "clear",
    description : "To clear chat",
    aliases : ['clean','delete'],
    async execute(client, message, args) {
        if (!message.member.hasPermission('MANAGE_MESSAGES')) return message.channel.send("You need `manage_messages` permission to execute this command.").then(message => {setTimeout(() => {message.delete()}, 2500)});
        if(!Number(args[0])) return message.channel.send("You need to enter a valid amount.").then(message => {setTimeout(() => {message.delete()}, 2500)});
        message.channel.bulkDelete(Number(args[0]) + 1).then(() => {
            message.channel.send(`Cleared ${args[0]} messages.`)
                .then(message => {
                    setTimeout(() => {
                        message.delete();
                    }, 2500);
                });
        });
    }
};