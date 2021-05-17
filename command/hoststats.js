const Discord = require('discord.js');
const osu = require('node-os-utils');
const mem = osu.mem
const cpu = osu.cpu

module.exports = {
    name: "hoststats",
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
    }
}

// var os = require('os');

// console.log(os.cpus());
// console.log(os.totalmem());
// console.log(os.freemem())