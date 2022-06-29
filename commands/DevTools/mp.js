const { admin } = require('../../settings.json')

module.exports.help = {
    name : "mp",
    description: 'Private Message anyone!',
    aliases : ['privatemessage','pm'],
    usage : '[Tag] [Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin) {
        const userMention = args[0].match(/<@!?([0-9]*)>/)

        if (userMention == null) {
            return message.channel.send('You have to tag someone !');
        } else {
            const user = client.users.cache.get(userMention[1])
            setTimeout(() => {message.delete()}, 500)
            const param = args.slice(1)
            user.send(param.join(' '))
        }
    }
};