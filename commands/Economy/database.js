const fs = require("fs")
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "database",
    description: 'Control Databases',
    aliases : ['db'],
    usage : '< add | remove > [name]'
};

module.exports.execute = async (client, message, args) => {
    if (['add', 'plus'].includes(args[0])) {
        message.channel.send("U serious ?")
    } else if (['remove', 'del', 'rem'].includes(args[0])) {
        fs.stat(`./database/${args[1]}.sqlite`, function(err, stat) {
            if(err == null) {
                message.channel.send('Database existing!')
                try {
                    fs.unlinkSync(`./database/${args[1]}.sqlite`)
                } catch (err) {
                    log(err)
                    message.channel.send('I can\'t delete that!')
                }
            } else if(err.code === 'ENOENT') {
                message.channel.send('Database not existing!')
            } else {
                log('Some other error: ', err.code);
                message.channel.send('I failed somewhere')
            }
        });
    }
};
