const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spammp",
    description: 'Spam command via private message',
    aliases : ['annoymp','repeatmp'],
    usage : '[Tag] [Number] [Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin || message.author.id == '548615362690940948') {
        const userMention = args[0].match(/<@!?([0-9]*)>/)

        if (userMention == null) {
            return message.channel.send('You have to tag someone !');
        } else {
            const user = client.users.cache.get(userMention[1])
            setTimeout(() => {message.delete()}, 500)
            const param = args.slice(2)
            const sleep = ms => new Promise(r => setTimeout(r, ms))
            for (let i = 0; i < args[1]; i++) {
                user.send(param.join(' '))
                await sleep(500)
            }
        }
    }
};