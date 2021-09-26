const Discord = require("discord.js");
const db = require("better-sqlite3");
const sql = db('./database/scores.sqlite');
const { updateScores, score } = require('../tools/dbUtils.js');

module.exports.help = {
    name : "points",
    description: 'See your amount of Points!',
    aliases : ['score','sc'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    const test = updateScores(score, message);
    const player = message.author.id 
    message.channel.send('Here you go' + await test.updateScores(player, message))
};