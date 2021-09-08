const { admin } = require('../settings.json')

module.exports.help = {
    name : "say",
    description: 'Say command',
    aliases : ['tell','shout'],
    usage : '[Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin || message.member.hasPermission('ADMINISTRATOR')) {
        message.channel.bulkDelete(1)
        message.channel.send(args.join(' '))
    }
};