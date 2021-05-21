const Discord = require('discord.js');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');

module.exports = {
    name : "rickroll",
    description: 'Rickroll the people',
    async execute(client, message, args) {
        if (!args[0]) {
            message.channel.send('You have to tag someone !');
            log("A stupid user failed Rickroll.");
            return;
        };
        let targetMember = message.mentions.users.first();
        const embed = new Discord.MessageEmbed()
            .setTitle(`${message.author.username} rickrolled ${targetMember.username}!`)
            .setImage('https://gifprint.s3.amazonaws.com/p/gif/25947/c80f6c3027280132bca8261bc7eb1de4.gif')
        
        if(args[0] === `${targetMember}`) {
            message.channel.send(embed);
            return;
        }
    }
};