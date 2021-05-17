const Discord = require('discord.js');
const settings = require('./settings.json');
const log = message => {
    console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`);
};

module.exports.run = async (client, msg, args) => {

    if (msg.author.id !== settings.admin) return false;
    log((' ') + chalk.black.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF.`));
    msg.channel.send('Turning off.').then(m => {
        client.destroy(); return
    });
};

module.exports.help = {
    name : "stop" 
}