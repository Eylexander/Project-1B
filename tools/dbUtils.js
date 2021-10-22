// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Define the database
const db = require("better-sqlite3");
const sql = new db('./database/stats.sqlite');

exports.initDatabases = function () {
    // Check if the table "points" exists.
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'stats';").get();
    if (!table['count(*)']) {
        // If the table isn't there, create it and setup the database correctly.
        sql.prepare("CREATE TABLE stats (id TEXT PRIMARY KEY, user TEXT, money INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_stats_id ON stats (id);").run();
        sql.pragma("asynchronous = 1");
        sql.pragma("journal_mode = wal");
    }

    // const getmoney = sql.prepare("SELECT * FROM stats WHERE user = ? AND tag = ?");
    // const setmoney = sql.prepare("INSERT OR REPLACE INTO stats (id, user, money) VALUES (@id, @user, @money);");
};

// const getmoney = sql.prepare("SELECT * FROM stats WHERE user = ? AND tag = ?");
// const setmoney = sql.prepare("INSERT OR REPLACE INTO stats (id, user, money) VALUES (@id, @user, @money);");

// module.exports = {
//     getmoney,
//     setmoney
// }