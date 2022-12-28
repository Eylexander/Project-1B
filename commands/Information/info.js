const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
var os = require('os');
const { version } = require('../../package.json');
const { admin } = require('../../settings.json');

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "info",
    description: 'Show bot information',
    aliases : ['stats', 'botinfo','infos'],
    usage : '<server | bot | host | owner> [Mode]',
    parameters: ['server', 'serveur', 'serv', 'bot', 'client', 'discordbot', 'host', 'hs', 'heberg', 'owner', 'dev', 'eylexander']
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
    // const adminusers = message.guild.members.cache.filter(m => m.hasPermission('ADMINISTRATOR')).map(m=>m.user.tag).join('\n')
    // const admins = message.guild.members.filter(member => member.hasPermission("ADMINISTRATOR"));

    // Search for args
    switch(args[0]) {
        case 'server':
        case 'serveur':
        case 'serv':
            const getServerEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'Owner', value: `${message.guild.owner === null ? 'No Owner Located' : message.guild.owner.user.tag + ' (' + message.guild.owner.id + ')'}`, inline: false},
                    { name: 'Created at', value: message.guild.createdAt.toLocaleString(), inline: true},
                    { name: 'Location', value: `${location.charAt(0).toUpperCase() + location.slice(1)}`, inline: true},
                    { name: 'Member Count', value: `${message.guild.memberCount}`, inline: true},
                    { name: 'AFK Channel', value: `${message.guild.afkChannelID === null ? 'No AFK Channel' : client.channels.get(message.guild.afkChannelID).name} ${message.guild.afkChannelID === null ? '' : message.guild.afkChannelID}`, inline: true},
                    { name: 'AFK Timeout', value: `${message.guild.afkTimeout / 60} minutes`, inline: true},
                    { name: 'Admins', value: adminusers, inline: true},
                )
                .setImage(message.guild.iconURL())
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            message.channel.send({ embeds: [getServerEmbed] });
            break;
        case 'bot':
        case 'client':
        case 'discordbot':
            const getBotEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
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
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});
                
            switch(args[1]) {
                case 'dev':
                case 'specs':
                    const getBotSpecificitiesEmbed = new EmbedBuilder()
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
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
                        .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

                    message.channel.send({ embeds: [getBotSpecificitiesEmbed] })
                    break;
                default:
                    message.channel.send({ embeds: [getBotEmbed] })
                    break;
            }
            break;
        case 'host':
        case 'hs':
        case 'heberg':
            const getHostEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'CPU', value: `Percentage of CPU Usage: ${usedcpu}%`, inline: true },
                    { name: 'Memory (RAM)', value: `Total Memory: ${totalram}MB\nUsed Memory: ${usedram}MB\nFree Memory: ${freeram}MB\nPercentage of Free Memory: ${prctfreeram}%`, inline: false},
                    { name: 'Bot Usage', value: `${((process.memoryUsage.rss() / 10**6 + " ").split('.')[0])}MB`, inline: true},
                    { name: 'Hostname', value: `${os.hostname}`, inline: true},
                )
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            message.channel.send({ embeds: [getHostEmbed] })
            break;
        case 'owner':
        case 'dev':
        case 'eylexander':
            const getOwnerEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
                .setThumbnail('https://cdn.discordapp.com/avatars/344526513577918477/0ebbf91a6b9d8326fa2f7f4eb6a93e70.webp')
                .addFields(
                    { name: 'Github', value: 'https://github.com/Eylexander#readme', inline: true},
                    { name: 'Website', value: 'https://eylexander.xyz/', inline: true},
                    { name: 'Contact', value: `https://discord.com/users/${admin}`, inline: true},
                )
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});
                
            message.channel.send({ embeds: [getOwnerEmbed] })
            break;
        default:
            const getGlobalEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL({ dynamic : true })})
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
                .setFooter({text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            message.channel.send({ embeds: [getGlobalEmbed] })
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('server')
            .setDescription('Show server information')
            .addStringOption(option =>
                option.setName('mode')
                    .setDescription('Show server information')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('bot')
            .setDescription('Show bot information')
            .addStringOption(option =>
                option.setName('mode')
                    .setDescription('Show bot information')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('host')
            .setDescription('Show host information')
            .addStringOption(option =>
                option.setName('mode')
                    .setDescription('Show host information')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('owner')
            .setDescription('Show owner information')
            .addStringOption(option =>
                option.setName('mode')
                    .setDescription('Show owner information')
                    .setRequired(false)))
    .setDMPermission(false)

module.exports.run = async (client, interaction) => {
    interaction.reply({ content: 'This command is not available in DMs', ephemeral: true })
};

// Function not working, need to improve it
// { name: 'Member Count', value: `${message.guild.memberCount - message.guild.members.filter(m=>m.user.bot).size} (${message.guild.members.filter(m=>m.user.bot).size} bots)`, inline: true},