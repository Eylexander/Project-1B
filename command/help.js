const Discord = require('discord.js');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};
const moment = require('moment');
const { execute } = require('./hoststats');

module.exports = {
    name: "help",
    description: "Help command",
    aliases: ['h', 'halp'],
    async execute(client, message, args) {
        message.channel.send("oui");
    }
}