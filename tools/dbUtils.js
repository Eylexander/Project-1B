const Discord = require("discord.js");
const client = new Discord.Client();
const db = require("better-sqlite3");
const sql = new db('./database/money.sqlite');
const fs = require('fs');

if (!fs.existsSync('./database')) {
    fs.mkdirSync('./database')
}

function initDatabases() {
    // Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'money';").get();
    if (!table['count(*)']) {
        // If the table isn't there, create it and setup the database correctly.
        sql.prepare("CREATE TABLE money (id TEXT PRIMARY KEY, user TEXT, tag TEXT, money INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_money_id ON money (id);").run();
        sql.pragma("asynchronous = 1");
        sql.pragma("journal_mode = wal");
    }
};

const getmoney = sql.prepare("SELECT * FROM money WHERE user = ? AND tag = ?");
const setmoney = sql.prepare("INSERT OR REPLACE INTO money (id, user, money) VALUES (@id, @user, @money);");

module.exports = {
    initDatabases,
    getmoney,
    setmoney
}