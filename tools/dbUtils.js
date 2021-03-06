// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Define the database
const db = require("better-sqlite3");
const inv = new db('./database/stats.sqlite');
const sent = new db('./database/infos.sqlite');
const tool = new db('./database/devtool.sqlite');
const ban = new db('./database/blockedusers.sqlite');

exports.initDatabases = function () {
    // Define the stats.sqlite database
    const stats = inv.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'stats';").get();
    if (!stats['count(*)']) {
        inv.prepare("CREATE TABLE stats (id TEXT PRIMARY KEY, user TEXT, money INTEGER, mana INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        inv.prepare("CREATE UNIQUE INDEX idx_stats_id ON stats (id);").run();
        inv.pragma("asynchronous = 1");
        inv.pragma("journal_mode = wal");
    }

    // Define the infos.sqlite database
    const suggestion = sent.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'infos';").get();
    if (!suggestion['count(*)']) {
        sent.prepare("CREATE TABLE infos (id TEXT PRIMARY KEY, user TEXT, name INTEGER, suggestions INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        sent.prepare("CREATE UNIQUE INDEX idx_infos_id ON infos (id);").run();
        sent.pragma("asynchronous = 1");
        sent.pragma("journal_mode = wal");
    }

    // Define the devtool.sqlite database
    const dev = tool.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'tool';").get();
    if (!dev['count(*)']) {
        tool.prepare("CREATE TABLE tool (id TEXT, user TEXT, todo TEXT, number INTERGER AUTO_INCREMENT);").run();
        // Ensure that the "id" row is always unique and indexed.
        tool.prepare("CREATE INDEX idx_devtool_id ON tool (number);").run();
        tool.pragma("asynchronous = 1");
        tool.pragma("journal_mode = wal");
    }

    const blocked = ban.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'ban';").get();
    if (!blocked['count(*)']) {
        ban.prepare("CREATE TABLE ban (id TEXT PRIMARY KEY, user TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        ban.prepare("CREATE UNIQUE INDEX idx_blocked_id ON ban (id);").run();
        ban.pragma("asynchronous = 1");
        ban.pragma("journal_mode = wal");
    }
};
