const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spammp",
    description: 'Spam command via private message',
    aliases : ['annoymp','repeatmp'],
    usage : '[Tag] [Number] [Information]',
    parameters: '<Tag> <Number>'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    switch (args[0] && args[1]) {
        case undefined || null:
            message.channel.send('You have to tag or Id someone !');
            break;
        default:
            if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first();

                setTimeout(() => {message.delete()}, 500)

                for (let i = 0; i < args[1]; i++) {
                    getMentionTag.send(args.slice(2).join(' '));
                    await sleep(500);
                }
            } else {
                // if (args[0].match(/([0-9]*)/)) {
                //     const getMentionId = args[0].match(/([0-9]*)/)
                //     const getUserObjectId = client.users.cache.get(getMentionId[1])

                //     setTimeout(() => {message.delete()}, 500)

                //     for (let i = 0; i < args[1]; i++) {
                //         getUserObjectId.send(args.slice(2).join(' '));
                //         await sleep(500);
                //     }
                // }
            }
            break;
    }
};