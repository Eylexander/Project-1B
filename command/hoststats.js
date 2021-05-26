const Discord = require('discord.js');
const osu = require('node-os-utils');
const mem = osu.mem
const cpu = osu.cpu
var os = require('os');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');

module.exports = {
    name: "hoststats",
    description : "Show Host specs",
    aliases : ["stats","hs","hostinfo"],
    async execute(client, message, args) {
        const { totalMemMbm, usedMemMb, freeMemMb, freeMemPercentage } = mem.info().then(info => {console.log(info)});
        const cpuUP = cpu.usage().then(cpuPercentage => {console.log(cpuPercentage)});

        const embed = new Discord.MessageEmbed()
            .setColor('RANDOM')
            .setTitle("Statistics")
            .setDescription("Stats of the bot")
            .addFields(
              { name: 'Memory (RAM)', value: 'Total Memory: ' + totalMemMbm + " MB\nUsed Memory: " + usedMemMb + " MB\nFree Memory: " + freeMemMb + " MB\nPercentage Of Free Memory: " + freeMemPercentage + "%", inline: true},
              { name: 'CPU', value: 'Percentage of CPU Usage: ' + cpuUP + "%", inline: true }
            )
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        message.channel.send(embed)
        log(os.cpus());
        log(os.totalmem());
        log(os.freemem());
    }
};

