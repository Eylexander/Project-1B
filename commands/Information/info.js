const Discord = require('discord.js');
var os = require('os');
const {version} = require('../../package.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name: "info",
    description : "Show bot information",
    aliases : ["stats", "botinfo","infos"],
    usage : '[Specific search] [Mode]'
};

module.exports.execute = async (client, message, args) => {
// Calculate precise RAM
    const totalram = ((os.totalmem() / 10**6 + " ").split('.')[0]);
    const freeram = ((os.freemem() / 10**6 + " ").split('.')[0]);
    const usedram = (((os.totalmem() - os.freemem()) / 10**6 + " ").split('.')[0]);
    const prctfreeram = (((os.freemem() * 100) / os.totalmem + " ").split('.')[0]);

    const usedcpu = process.cpuUsage().heapUsed;

// Calculate precise uptime
    let totalSeconds = (client.uptime / 1000);
    let days = Math.floor(totalSeconds / 86400);
    totalSeconds %= 86400;
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);

// Random variables
    const location = message.guild.region;
    const adminusers = message.guild.members.cache.filter(m => m.hasPermission('ADMINISTRATOR')).map(m=>m.user.tag).join('\n')

// Search for args
    if (['server', 'serveur', 'serv'].includes(args[0])) {
    const server = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields(
            { name: 'Owner', value: `${message.guild.owner === null ? 'No Owner Located' : message.guild.owner.user.tag + '(message.guild.owner.id)'}`, inline: false},
            { name: 'Created at', value: message.guild.createdAt.toLocaleString(), inline: true},
            { name: 'Location', value: `${location.charAt(0).toUpperCase() + location.slice(1)}`, inline: true},
            { name: 'Member Count', value: `${message.guild.memberCount}`, inline: true},
            { name: 'AFK Channel', value: `${message.guild.afkChannelID === null ? 'No AFK Channel' : client.channels.get(message.guild.afkChannelID).name} ${message.guild.afkChannelID === null ? '' : message.guild.afkChannelID}`, inline: true},
            { name: 'AFK Timeout', value: `${message.guild.afkTimeout / 60} minutes`, inline: true},
            { name: 'Admins', value: adminusers, inline: true},
        )
        .setImage(message.guild.iconURL())
        .setTimestamp()
        .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        
        message.channel.send(server);
    }
    else if (['bot', 'client', 'discordbot'].includes(args[0])){
        const bot = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: 'Version', value: version, inline: true},
                { name: 'Librairie', value: `Discord.js 12.5.0`, inline: true},
                { name: 'Members', value: `${eval(client.guilds.cache.map(g => g.memberCount).join(' + '))}`, inline: true},
                { name: 'Servers', value: client.guilds.cache.size, inline: true},
                { name: 'Channels', value: client.channels.cache.size, inline: true},
                { name: 'Uptime (s)', value: `${days}d${hours}h${minutes}m${seconds}s`, inline: true},
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

    if (['dev', 'specs'].includes(args[1])){
        const botspecs = new Discord.MessageEmbed()
          .setColor('RANDOM')
          .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
          .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
          .addFields(
              { name: 'Version', value: version, inline: true},
              { name: 'Librairie', value: `Discord.js 12.5.0`, inline: true},
              { name: 'Members', value: `${eval(client.guilds.cache.map(g => g.memberCount).join(' + '))}`, inline: true},
              { name: 'Servers', value: client.guilds.cache.size, inline: true},
              { name: 'Channels', value: client.channels.cache.size, inline: true},
              { name: 'Uptime (s)', value: `${days}d${hours}h${minutes}m${seconds}s`, inline: true},
          )
          .setTimestamp()
          .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
  
        message.channel.send(botspecs);
    } else {
        message.channel.send(bot);
    }
    } 
    else if (['host', 'hs', 'heberg'].includes(args[0])){
        const host = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setAuthor(client.user.username, client.user.displayAvatarURL({ dynamic : true }))
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields(
                { name: 'CPU', value: `Percentage of CPU Usage: ${usedcpu}%`, inline: true },
                { name: 'Memory (RAM)', value: `Total Memory: ${totalram}MB\nUsed Memory: ${usedram}MB\nFree Memory: ${freeram}MB\nPercentage of Free Memory: ${prctfreeram}%`, inline: false},
                { name: 'Bot Usage', value: `${((process.memoryUsage.rss() / 10**6 + " ").split('.')[0])}MB`, inline: true},
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

// Function not working, need to improve it
// { name: 'Member Count', value: `${message.guild.memberCount - message.guild.members.filter(m=>m.user.bot).size} (${message.guild.members.filter(m=>m.user.bot).size} bots)`, inline: true},