// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Define the database
const db = require("better-sqlite3");
const sql = new db('./database/stats.sqlite');

exports.initDatabases = function () {
    const table = sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'stats';").get();
    if (!table['count(*)']) {
        sql.prepare("CREATE TABLE stats (id TEXT PRIMARY KEY, user TEXT, money INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sql.prepare("CREATE UNIQUE INDEX idx_stats_id ON stats (id);").run();
        sql.pragma("asynchronous = 1");
        sql.pragma("journal_mode = wal");
    }
};
