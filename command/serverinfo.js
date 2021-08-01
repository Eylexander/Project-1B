module.exports.help = {
    name : "serverpic",
    description: `Display the Server's picture`,
    aliases : ['si','serverinformation','serverinfos','servinfo','servinf'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    message.channel.send("Here you go !");
    message.channel.send(message.guild.iconURL());
};