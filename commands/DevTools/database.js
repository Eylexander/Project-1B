const fs = require("fs")
const { admin } = require('../../settings.json')
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "database",
    description: 'Control Databases',
    aliases : ['db'],
    usage : '< add | remove > [name]',
    parameters: ['add', 'remove']
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    if (['add', 'plus'].includes(args[0])) {
        message.channel.send("U serious bro ?")
    } else if (['remove', 'del', 'rem'].includes(args[0])) {
        fs.stat(`./database/${args[1]}.sqlite`, function(err, stat) {
            if(err == null) {
                message.channel.send(`Database named ${args[1]}.sqlite existing!`)
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
    } else if (['list', 'name'].includes(args[0])) {
        const commandfolder = fs.readdirSync('./database');
        for (const file of commandfolder) {
            fs.stat(`./database/${file}.sqlite`, function(err, stat) {
                if(err == null) {
                    message.channel.send(`Database named ${file}.sqlite existing!`)
                } else {
                    log('Some other error: ', err.code);
                    message.channel.send('I failed somewhere')
                }
            });
        }
    }
};