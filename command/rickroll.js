const Discord = require('discord.js');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');
const fetch = require("node-fetch");

module.exports = {
    name : "rickroll",
    description: 'Rickroll the people',
    aliases : ['rick', 'troll'],
    tuto : '[user]',
    async execute(client, message, args) {

        function ricks() {
            return fetch("https://tenor.com/search/rickroll-gifs")
              .then(res => {
                return res.json()
                })
              .then(data => {
                return data[0]["q"] + " -" + data[0]["a"]
              })
          }

        if (!args[0]) {
            message.channel.send('You have to tag someone !');
            log("A stupid user failed Rickroll.");
            return;
        };
        let targetMember = message.mentions.users.first();
        const embed = new Discord.MessageEmbed()
            .setTitle(`${message.author.username} rickrolled ${targetMember.username}!`)
            .setImage('https://media.tenor.com/images/a1505c6e6d37aa2b7c5953741c0177dc/tenor.gif')
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        
        if(args[0] === `${targetMember}`) {
            return message.channel.send(embed);
        }
    }
};