const Discord = require('discord.js');

module.exports.help = {
    name : "todo",
    description: 'Get todo list!',
    aliases : ['td'],
    usage : '[none]'
};

module.exports.execute = async (client, message, args) => {
    const msg = await message.channel.send('Pinging Bot ...')
    msg.edit(`Pong! Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`);
};