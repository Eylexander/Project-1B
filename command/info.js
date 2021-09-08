const Discord = require('discord.js');
var os = require('os');
const client = new Discord.Client();
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name: "info",
    description : "Show bot information",
    aliases : ["stats","hs","hostinfo", "oststat","infos"],
    usage : '[Specific info]'
};

module.exports.execute = async (client, message, args) => {
  const totalram = ((os.totalmem() / 10**6 + " ").split('.')[0]);
  const freeram = ((os.freemem() / 10**6 + " ").split('.')[0]);
  const usedram = (((os.totalmem() - os.freemem()) / 10**6 + " ").split('.')[0]);
  const prctfreeram = (((os.freemem() * 100) / os.totalmem + " ").split('.')[0]);
  // console.log(process.cpuUsage());

  const embed = new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
    .addFields(
      { name: 'Hostname', value: `${os.hostname}`, inline: true},
      { name: 'Uptime (s)', value: `${client.uptime}`, inline: true},
    //   { name: 'CPU', value: `Percentage of CPU Usage: ${os.cpus()}%`, inline: true },
      { name: 'Memory (RAM)', value: `Total Memory: ${totalram}MB\nUsed Memory: ${usedram}MB\nFree Memory: ${freeram}MB\nPercentage of Free Memory: ${prctfreeram}%`, inline: false},
      { name: 'Librairie', value: 'Discord.js', inline: true},
    )
    .setTimestamp()
    .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

  message.channel.send(embed)
};