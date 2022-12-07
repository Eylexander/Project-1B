const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spammp",
    description: 'Spam command via private message',
    aliases : ['annoymp','repeatmp'],
    usage : '[Tag] [Number] [Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin) {
        
        if (args[0].match(/<@!?([0-9]*)>/)) {
            const userMention = args[0].match(/<@!?([0-9]*)>/);
            const user = client.users.cache.get(userMention[1])
            setTimeout(() => {message.delete()}, 500)
            const sleep = ms => new Promise(r => setTimeout(r, ms))
                for (let i = 0; i < args[1]; i++) {
                    user.send(args.slice(2).join(' '))
                    await sleep(500)
                }

        } else {
            if (args[0].match(/^([0-9]*$)/)) {
                const userId = args[0].match(/^([0-9]*$)/);
                const userObject = await client.users.fetch(userId[1]);

                setTimeout(() => {message.delete()}, 500)
                const sleep = ms => new Promise(r => setTimeout(r, ms))
                for (let i = 0; i < args[1]; i++) {
                    userObject.send(args.slice(2).join(' '))
                    await sleep(500)
                }
                
            } else {
                return message.channel.send('You have to tag someone !');
            }
        }

    }
};