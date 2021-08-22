const Discord = require('discord.js');
const fs = require('fs');
const {prefix} = require('../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "suggestion",
    description : "Add a suggestion to the todo list!",
    aliases : ['suggest', 'sugg'],
    usage : "[name] [description]"
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
    } else {
        
    }
};