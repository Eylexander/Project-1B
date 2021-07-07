module.exports.help = {
    name : "test",
    description: 'Pong command',
    aliases : ['tst','try'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    message.channel.send("Ping!");
};