const Discord = require('discord.js');
const { ricks } = require('../../tools/word_libraries.json')

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
      .setColor('RANDOM')
      .setTitle(`${message.author.username} rickrolled ${targetMember.username}!`)
      .setImage(ricks[Math.floor(Math.random()*ricks.length)])
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
  
  if(args[0] === `${targetMember}`) {
      return message.channel.send(embed);
  } else {
    return message.channel.send("You failed your command somewhere.")
  }
};