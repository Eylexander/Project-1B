const Discord = require('discord.js');
const settings = require('../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "stop",
    description: 'Stop command',
    aliases : ['end','ends','off','kill'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id !== settings.admin) return message.channel.send ("You are not authorised.");
        log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
        message.channel.send('Turning off.').then(m => {
            client.destroy();
        });
}