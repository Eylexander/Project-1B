const Discord = require('discord.js');

module.exports.help = {
    name : "mythologie",
    description : 'Teaches you Mythologie.',
    aliases : ['myth'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    message.channel.send("Working on it ...");
};