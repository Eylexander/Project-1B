const Discord = require('discord.js');
var os = require('os');

module.exports.help = {
    name : "test",
    description: 'Pong command',
    aliases : ['tst','try'],
    usage : 'none'
};

module.exports.execute = async (client, message, args) => {
  const userMention = args[0].match(/<@!?([0-9]*)>/)
  if (userMention == null) {
  
    return message.channel.send("Il faut mentionner quelqu'un.")
  
  } else {
  
    const user = client.users.get(userMention[1])
  
    return message.channel.send('Bonsoir ' + user.username)
  }
}

// module.exports.execute = async (client, message, args) => {
//     const notSupported = "The operating system used to host this bot is not supported for this command."
//       const full = '█'
//       const empty = '░'
//       const precision = 20
      
//       const freeRAM = os.freemem()
//       const usedRAM = os.totalmem() - freeRAM;
      
//       const diagramMaker = (used, free) => {
//         const total = used + free;
//         used = Math.round((used / total) * precision)
//         free = Math.round((free / total) * precision)
//         return full.repeat(used) + empty.repeat(free)
//       }
      
//       let cpuUsage;
      
//       const p1 = osu.cpu.usage().then(cpuPercentage => {
//         cpuUsage = cpuPercentage;
//       })
      
//       let processes;
      
//       const p2 = osu.proc.totalProcesses().then(process => {
//         processes = process;
//       })
      
//       let driveUsed, driveFree;
      
//       const p3 = osu.drive.info().then(i => {
//         driveUsed = i.usedPercentage;
//         driveFree = i.freePercentage;
//       }).catch(() => {
//         driveUsed = false;
//       })
      
//       let networkUsage, networkUsageIn, networkUsageOut;
      
//       const p4 = osu.netstat.inOut().then(i => {
//         networkUsage = i.total;
//         networkUsageIn = networkUsage.inputMb;
//         networkUsageOut = networkUsage.outputMb;
//       }).catch(() => {
//         networkUsage = false;
//       })
      
//       await Promise.all([p1, p2, p3, p4]);
      
//       const embed = new Discord.MessageEmbed()
//         .setColor('#800080')
//         .setDescription('Here is the bot stats!')
//         .setAuthor('Hexx#3560', 'https://cdn.discordapp.com/avatars/754809998789443605/3f4f8e73962c81e9b992830b464ffe86.png?size=256')
//         .addField(`Main Package Version:`, `Discord.js Version: 12.2.0\nDiscord.js-Commando Version: 0.10.0\nNode.js Version: 12.x`)
//         .addField(`Used:`,(`RAM: ${diagramMaker(usedRAM, freeRAM)} [${Math.round(100 * usedRAM / (usedRAM + freeRAM))}%]\n`+
//         `CPU: ${diagramMaker(cpuUsage, 100-cpuUsage)} [${Math.round(cpuUsage)}%]\n`+
//         `HEXX PROCESS: ${(process.memoryUsage().heapUsed / 1000000).toFixed(2)}MB\n`+
//         `STORAGE: ${driveUsed ? `${diagramMaker(driveUsed, driveFree)} [${Math.round(driveUsed)}%]` : notSupported}\n`+
//         `PROCESSES: ${processes != 'not supported'? processes : notSupported}`).trim())
//         .addField(`Machine Specs:`,`CPU Count: ${osu.cpu.count()}\nCPU Model: ${os.cpus()[0].model}\nCPU Speed: ${os.cpus()[0].speed}MHz
//     ${osu.os.platform() != "win32" ? `Storage: ${diagramMaker(driveUsed,driveFree)} [${driveUsed}%]`: ""}`)
//         .addField(`System Specs:`,`System Type: ${osu.os.type()}\nSystem Architecture: ${osu.os.arch()}\nSystem Platform: ${osu.os.platform()}`)
//         .addField(`Network Stats:`,`${networkUsage ? `Input Speed: ${networkUsageIn}\nOutput Speed: ${networkUsageOut}` : notSupported}`)
//         .setTimestamp()
//         .setFooter('Hexx#3560', 'https://cdn.discordapp.com/avatars/754809998789443605/3f4f8e73962c81e9b992830b464ffe86.png?size=256');
        
//       message.channel.send(embed);
// };