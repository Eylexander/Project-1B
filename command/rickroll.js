const Discord = require('discord.js');

module.exports.help = {
  name : "rickroll",
  description: 'Rickroll the people',
  aliases : ['rick', 'troll', 'rr'],
  usage : '[user]'
};

module.exports.execute = async (client, message, args) => {
  if (!args[0]) {
    return message.channel.send('You have to tag someone !');
  };
  
  let targetMember = message.mentions.users.first();
  const embed = new Discord.MessageEmbed()
      .setTitle(`${message.author.username} rickrolled ${targetMember.username}!`)
      .setImage('https://media.tenor.com/images/a1505c6e6d37aa2b7c5953741c0177dc/tenor.gif')
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
  
  if(args[0] === `${targetMember}`) {
      return message.channel.send(embed);
  } else {
    return message.channel.send("You failed your command somewhere.")
  }
};