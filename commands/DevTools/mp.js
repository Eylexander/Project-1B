const { admin } = require('../../settings.json')

module.exports.help = {
    name : "mp",
    description: 'Private Message anyone!',
    aliases : ['privatemessage','pm'],
    usage : '[Tag] [Information]',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;

    switch (args[0]) {
        case /<@!?([0-9]*)>/.test(args[0]):
            const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
            const getUserObjectTag = client.users.cache.get(getMentionTag[1])

            setTimeout(() => {message.delete()}, 500)
            getUserObjectTag.send(args.slice(1).join(' '))
            break;
        case /^([0-9]*$)/.test(args[0]):
            const getMentionId = args[1].match(/([0-9]*)/)
            const getUserObjectId = client.users.cache.get(getMentionId[1])

            setTimeout(() => {message.delete()}, 500)
            getUserObjectId.send(args.slice(1).join(' '))
            break;
        default:
            message.channel.send('You have to tag or Id someone !');
            break;
    }
};