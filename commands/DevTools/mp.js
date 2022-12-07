const { admin } = require('../../settings.json')

module.exports.help = {
    name : "mp",
    description: 'Private Message anyone!',
    aliases : ['privatemessage','pm'],
    usage : '[Tag] [Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin) {

        if (args[0].match(/<@!?([0-9]*)>/)) {
            const userMention = args[0].match(/<@!?([0-9]*)>/);
            const user = client.users.cache.get(userMention[1])
            setTimeout(() => {message.delete()}, 500)
            user.send(args.slice(1).join(' '))

        } else {
            if (args[0].match(/^([0-9]*$)/)) {
                const userId = args[0].match(/^([0-9]*$)/);
                const userObject = await client.users.fetch(userId[1]);

                setTimeout(() => {message.delete()}, 500)
                userObject.send(args.slice(1).join(' '))
                
            } else {
                return message.channel.send('You have to tag someone !');
            }
        }
    }
};