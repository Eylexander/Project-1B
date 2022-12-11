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
        case undefined || null:
            message.channel.send('You have to tag or Id someone !');
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();

                setTimeout(() => {message.delete()}, 500)

                getMentionTag.send(args.slice(1).join(' '));
            } else {
                // if (args[0].match(/([0-9]*)/)) {
                //     const getMentionId = args[0].match(/([0-9]*)/)
                //     const getUserObjectId = client.users.cache.get(getMentionId[1])

                //     setTimeout(() => {message.delete()}, 500)

                //     getUserObjectId.send(args.slice(1).join(' '));
                // }
            }
            break;
    }
};