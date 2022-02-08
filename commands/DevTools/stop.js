const settings = require('../../settings.json');
const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "stop",
    description: 'Stop command',
    aliases : ['end','ends','off','kill'],
    usage : 'none'
};

module.exports.execute = async (client, message, args) => {
    try {
        if (!message.author.id === settings.admin) return;
        log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
        setTimeout(() => {message.delete()}, 1000)
        message.channel.send('Turning off...')
            .then(message => {
                setTimeout(() => { message.delete()}, 1500) })
                setTimeout(() => { client.destroy() }, 3000);
    } catch (err) {
        log(err)
    }
    
}