const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spam",
    description: 'Spam command',
    aliases : ['annoy','repeat'],
    usage : '[number] [Information]'
};

module.exports.execute = async (client, message, args) => {
    if (message.author.id == admin) {
        setTimeout(() => {message.delete()}, 500)
        const param = args.slice(1)
        for (let i = 0; i < args[0]; i++) {
            message.channel.send(param.join(' '))
            setTimeout(() => {}, 2000) // Pause not working
        }
    }
};