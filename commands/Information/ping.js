const { SlashCommandBuilder } = require('discord.js');

// module.exports.help = {
//     name : "ping",
//     description: 'Ping command',
//     aliases : ['pong'],
//     usage : 'none',
//     parameters: 'none'
// };

// module.exports.data = {
//     new SlashCommandBuilder()
//         .setName('ping')
//         .setDescription('Ping command')
// }

// module.exports.execute = async (client, message, args, interaction) => {
//     const msg = await message.channel.send('Pinging Bot ...')
//     msg.edit(`Pong! Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`);
// };

module.exports = {
    help: {
        name : "ping",
        description: 'Ping command',
        aliases : ['pong'],
        usage : 'none',
        parameters: 'none'
    },
    execute: async (client, message, args) => {
        const msg = await message.channel.send('Pinging Bot ...')
        msg.edit(`Pong! Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`);
    },
    data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Ping command'),
    run: async (interaction) => {
        await interaction.reply('Pinging Bot ...')
        await interaction.editReply(`Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms.`)
    }
}