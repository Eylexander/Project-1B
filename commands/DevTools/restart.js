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
    try {
        if (!message.author.id === admin) return ;
        log('Restarting ...')
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