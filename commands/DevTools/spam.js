const { admin } = require('../../settings.json')

module.exports.help = {
    name : "spam",
    description: 'Spam command',
    aliases : ['annoy','repeat'],
    usage : '[number] [Information]',
    parameters: '<Number>'
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;

    if (!args[0]) return message.reply({ content: "You have to enter a number !", allowedMentions: { repliedUser: false }})

    setTimeout(() => {message.delete()}, 500)
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < args[0]; i++) {
        message.channel.send(args.slice(1).join(' '))
        await sleep(500)
    }
};