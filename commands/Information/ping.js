const { SlashCommandBuilder } = require('discord.js');

// Create the json script for the help command
module.exports.help = {
    name : "ping",
    description: 'Ping command',
    aliases : ['pong'],
    usage : 'none',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    
    // Send the message and edit it with the ping
    message.reply({
        content: 'Pinging Bot ...',
        allowedMentions: { repliedUser: false }
    }).then(msg => {
        msg.edit(`Pong! Latency is \`${msg.createdTimestamp - message.createdTimestamp}ms\`. Websocket Latency is \`${Math.round(client.ws.ping)}ms\`.`);
    });
};

// Create the json script for the slash command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(true)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {
    
    // Send the message and edit it with the ping and catch any errors
    try {
        const msg = await interaction.reply({ content: "Pong!", fetchReply: true });
  
        await interaction.editReply({ content: `Pong! Latency is \`${msg.createdTimestamp - interaction.createdTimestamp}ms\`. Websocket Latency is \`${client.ws.ping}ms\`` });
    } catch (err) {
        // If there is an error, log it
        console.log("Something Went Wrong => ", err);
    }

};