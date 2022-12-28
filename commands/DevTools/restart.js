const { SlashCommandBuilder } = require('discord.js');
const { admin, token } = require('../../settings.json')
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "restart",
    description: 'Restart command but does not apply changes.',
    aliases : ['rs','reset'],
    usage : 'none',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    try {
        log('Restarting ...');
        setTimeout(() => {message.delete()}, 1000)
        message.channel.send('Restarting...')    
            .then(async message => {
                await client.destroy()
                client.login(token)
                await message.edit('Restart worked')
                setTimeout(() => {message.delete()}, 2000)
            });
    } catch(error) {
        log(error)
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(true);

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;
    try {
        log('Restarting ...');
        interaction.reply('Restarting...')
        setTimeout(() => {client.destroy()}, 1000)
        setTimeout(() => {client.login(token)}, 2000)
        setTimeout(() => {interaction.editReply('Restart worked')}, 3000)
        setTimeout(() => {interaction.deleteReply()}, 5000)
        
    } catch(error) {
        log(error)
    }
};