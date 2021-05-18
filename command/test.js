module.exports = {
    name : "pong",
    description: 'Pong command',
    async execute(client, message, args) {
        message.channel.send("Ping!");
    },
};