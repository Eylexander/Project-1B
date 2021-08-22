const Discord = require('discord.js');

module.exports.help = {
    name : "serverpic",
    description: `Display the Server's picture`,
    aliases : ['si','serverinformation','serverinfos','servinfo','servinf'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setTitle("Here you go !")
        .setImage(message.guild.iconURL())
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
    message.channel.send(embed);
};