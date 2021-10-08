// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Define the database
const db = require("better-sqlite3");
const sql = new db('./database/money.sqlite');

exports.initDatabases = function () {
    // Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
        // If the table isn't there, create it and setup the database correctly.
        sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, tag TEXT, scores INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        sql.pragma("asynchronous = 1");
        sql.pragma("journal_mode = wal");
    }
};

// const getmoney = sql.prepare("SELECT * FROM scores WHERE user = ? AND tag = ?");
// const setmoney = sql.prepare("INSERT OR REPLACE INTO scores (id, user, scores) VALUES (@id, @user, @scores);");

// module.exports = {
//     getmoney,
//     setmoney
// }