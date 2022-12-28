const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "logout",
    description: 'Disconnect from the console',
    aliases : ['out'],
    usage : 'none',
    parameters : 'none'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    try {
        log('Disconnecting from console ...')
        setTimeout(() => {message.delete()}, 1000)
        message.channel.send('Logging out...')
            .then(message => {
                setTimeout(() => { message.delete()}, 1500)
            })
        setTimeout(() => { process.exit(1) }, 3000);
        setTimeout(() => { client.destroy() }, 3000);
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
        log('Disconnecting from console ...')
        interaction.reply({
            content: 'Logging out...',
            ephemeral: true
        })
        setTimeout(() => { process.exit(1) }, 3000);
        setTimeout(() => { client.destroy() }, 3000);
        setTimeout(() => { interaction.deleteReply() }, 3000);
    } catch(error) {
        log(error)
    }
};