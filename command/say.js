module.exports.help = {
    name : "say",
    description: 'Say command',
    aliases : ['tell','shout'],
    usage : '[Information]'
};

module.exports.execute = async (client, message, args) => {
    message.channel.bulkDelete(1)
    message.channel.send(args.join(' '))
};