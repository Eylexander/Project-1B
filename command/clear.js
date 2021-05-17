const Discord = require('discord.js');

module.exports.run = async (client, msg, args) => {
    if(!args[0]) return msg.channel.send("gros con");
    msg.channel.bulkDelete(args[0]).then(() => {
        msg.channel.send(`Cleared ${args[0]} messages.`).then(message => message.delete(5000));
    });
};

module.exports.help = {
    name : "clear"
};