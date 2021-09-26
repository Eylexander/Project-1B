const Discord = require("discord.js");
const client = new Discord.Client();
const db = require("better-sqlite3");
const sql = new db('./database/scores.sqlite');

async function initDatabases() {
    // Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
        // If the table isn't there, create it and setup the database correctly.
        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, tag TEXT, guild TEXT, name TEXT, points INTEGER, level INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        sql.pragma("asynchronous = 1");
        sql.pragma("journal_mode = wal");
    }
};

async function getScore() {
  getScore = sql.prepare("SELECT * FROM scores WHERE user = ? AND tag = ? AND guild = ? AND name = ?");
}

async function setScore() {
  setScore = sql.prepare("INSERT OR REPLACE INTO scores (id, user, tag, guild, name, points, level) VALUES (@id, @user, @tag, @guild, @name, @points, @level);");
}

async function updateScores(score) {
    if (message.guild) {
        score = getScore.get(message.author.id, message.author.tag, message.guild.id, message.guild.name);
        if (!score) {
          score = { id: `${message.guild.name} (${message.guild.id}) - ${message.author.tag} (${message.author.id})`, user: message.author.id, tag: message.author.tag, guild: message.guild.id, name: message.guild.name, points: 0, level: 1 }
        }
        score.points++;
        const curLevel = Math.floor(0.1 * Math.sqrt(score.points));
        if(score.level < curLevel) {
          score.level++;
          message.reply(`You've leveled up to level **${curLevel}**!`);
        }
        setScore.run(score);
    }
};


module.exports = {
  initDatabases,
  updateScores,
  getScore,
  setScore
}