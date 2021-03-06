const { admin } = require('../../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "logout",
    description: 'Disconnect from the console',
    aliases : ['out'],
    usage : 'none'
};

module.exports.execute = async (client, message, args) => {
    try {
        if (!message.author.id === admin) return;
        log('Disconnecting from console ...')
        setTimeout(() => {message.delete()}, 1000)
        message.channel.send('Logging out...')
            .then(message => {
                setTimeout(() => { message.delete()}, 1500) })
                setTimeout(() => { process.exit(1) }, 3000);
                setTimeout(() => { client.destroy() }, 3000);
    } catch(error) {
        log(error)
    }
};