const { admin } = require('../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "logout",
    description: 'Disconnect from the console',
    aliases : ['out'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    if(message.author.id === admin) {
        log('Disconnecting from console ...')
        setTimeout(() => {message.delete()}, 500)
        message.channel.send('Logging out...')
            .then(message => {
                setTimeout(() => {message.delete()}, 2000)})
                setTimeout(function() { process.exit(1); }, 3000);
    } else {
        return;
    };
};