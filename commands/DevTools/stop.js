const { SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name: "stop",
    description: 'Stop command',
    aliases : ['end','ends','off','kill'],
    usage : 'none',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    try {
        log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
        setTimeout(() => {message.delete()}, 1000)
        message.channel.send('Turning off...')
            .then(message => {
                setTimeout(() => { message.delete()}, 1500)
            })
        setTimeout(() => { client.destroy() }, 3000);
    } catch (err) {
        log(err)
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;
    try {
        log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
        interaction.reply('Turning off...')
        setTimeout(() => { client.destroy() }, 3000);
    } catch (err) {
        log(err)
    }
};