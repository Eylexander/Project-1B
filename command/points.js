const Discord = require("discord.js");
const db = require("better-sqlite3");
const sql = new db('./database/scores.sqlite');


module.exports.help = {
    name : "points",
    description: 'See your amount of Points!',
    aliases : ['score','sc'],
    usage : ''
};

module.exports.execute = async (client, message, args) => {
    const {
    initDatabases,
    updateScores
    } = require('./tools/dbUtils.js')

    client.on('ready', () => {
        initDatabases(sql)
    })

    client.on('message', () => {
        updateScores(sql)
    })

    message.channel.send(`You currently have ${score.points} points and are level ${score.level}!`);
};