const Discord = require('discord.js');
const fs = require('fs');
const { stringify } = require('querystring');

module.exports.help = {
    name : "suggestion",
    description : "Add a suggestion to the todo list!",
    aliases : ['suggest', 'sugg'],
    usage : "[name] [description]"
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        message.channel.send(`Please specify your idea using this format : ${help.usage}`)
    } else {
        fs.writeFile("../tools/Suggestions.json", (err) => {
            if (err) console.log(err)
        })
    }
};