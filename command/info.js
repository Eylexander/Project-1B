const Discord = require('discord.js');
var os = require('os');
const { version } = require('../package.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name: "info",
    description : "Show bot information",
    aliases : ["stats", "botinfo","infos"],
    usage : '[Specific info]'
};

const usedcpu = process.cpuUsage().heapUsed;

module.exports.execute = async (client, message, args) => {
// Calculate precise RAM
  const totalram = ((os.totalmem() / 10**6 + " ").split('.')[0]);
  const freeram = ((os.freemem() / 10**6 + " ").split('.')[0]);
  const usedram = (((os.totalmem() - os.freemem()) / 10**6 + " ").split('.')[0]);
  const prctfreeram = (((os.freemem() * 100) / os.totalmem + " ").split('.')[0]);

// Calculate precise uptime
  let totalSeconds = (client.uptime / 1000);
  let days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = Math.floor(totalSeconds % 60);


  // { name: '', value: '', inline: true},

// Search for args
  if (args[0] === 'server' || args[0] === 'serveur' || args[0] === 'serv') {
    const server = new Discord.MessageEmbed()
      .setColor('RANDOM')
      .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
      .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
      .addFields(
        { name: 'Owner', value: `${message.guild.owner.user.tag} (${message.guild.owner.id})`, inline: false},
        { name: 'Created at', value: message.guild.createdAt.toLocaleString(), inline: true},
        { name: 'Location', value: message.guild.region, inline: true},
        // { name: 'Member Count', value: `${message.guild.memberCount - message.guild.members.filter(m=>m.user.bot).size} (${message.guild.members.filter(m=>m.user.bot).size} bots)`, inline: true},
        { name: 'AFK Channel', value: `${message.guild.afkChannelID === null ? 'No AFK Channel' : client.channels.get(message.guild.afkChannelID).name} ${message.guild.afkChannelID === null ? '' : message.guild.afkChannelID}`, inline: true},
        { name: 'AFK Timeout', value: `${message.guild.afkTimeout / 60} minutes`, inline: true},
        // { name: 'Admins', value: `${message.guild.members.hasPermission('ADMINISTRATOR').members.map(m=>m.user.tag).join('\n')}`, inline: true},
      )
      .setImage(message.guild.iconURL())
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(server);
  }
  else if (args[0] === 'bot' || args[0] === 'client' || args[0] === 'discordbot'){
    const bot = new Discord.MessageEmbed()
      .setColor('RANDOM')
      .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
      .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
      .addFields(
        { name: 'Version', value: version, inline: true},
      )
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(bot);
  } 
  else if (args[0] === 'host' || args[0] === 'hs' || args[0] === 'heberg'){
    const host = new Discord.MessageEmbed()
      .setColor('RANDOM')
      .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
      .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
      .addFields(
        { name: 'Hostname', value: `${os.hostname}`, inline: true},
      )
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(host);
  }
  else {
    const global = new Discord.MessageEmbed()
      .setColor('RANDOM')
      .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
      .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
      .addFields(
        { name: 'Hostname', value: `${os.hostname}`, inline: true},
        { name: 'Version', value: version, inline: true},
        { name: 'Uptime (s)', value: `${days}d${hours}h${minutes}m${seconds}s`, inline: true},
        { name: 'CPU', value: `Percentage of CPU Usage: ${usedcpu}%`, inline: true },
        { name: 'Memory (RAM)', value: `Total Memory: ${totalram}MB\nUsed Memory: ${usedram}MB\nFree Memory: ${freeram}MB\nPercentage of Free Memory: ${prctfreeram}%`, inline: true},
        { name: 'Librairie', value: 'Discord.js', inline: true},
      )
      .setTimestamp()
      .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    message.channel.send(global);
  };
};