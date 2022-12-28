// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Organize the Economy System
if (!fs.existsSync('./database/economy')) { fs.mkdirSync('./database/economy') };

// Define the database
const db = require("better-sqlite3");
const sent = new db('./database/infos.sqlite');
const tool = new db('./database/devtool.sqlite');
const ban = new db('./database/blockedusers.sqlite');

// Define the database for the economy system
const inv = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');
const ite = new db('./database/economy/items.sqlite');
const usit = new db('./database/economy/useritems.sqlite');

exports.initDatabases = function () {
    // Define the stats.sqlite database for the economy system
    const stats = inv.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'stats';").get();
    if (!stats['count(*)']) {
        inv.prepare("CREATE TABLE stats (id TEXT PRIMARY KEY, user TEXT, money INTEGER, mana INTEGER, maxmana INTEGER, business TEXT, businessID INTEGER, level INTEGER, xp INTEGER);").run();
        inv.prepare("ALTER TABLE stats ADD FOREIGN KEY (businessID) REFERENCES business (id);").run();
        // Ensure that the "id" row is always unique and indexed.
        inv.prepare("CREATE UNIQUE INDEX idx_stats_id ON stats (id);").run();
        inv.pragma("asynchronous = 1");
        inv.pragma("journal_mode = wal");
    }

    const business = bus.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'business';").get();
    if (!business['count(*)']) {
        bus.prepare("CREATE TABLE business (id TEXT PRIMARY KEY, business TEXT, level INTEGER, number INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        bus.prepare("CREATE UNIQUE INDEX idx_business_id ON business (id);").run();
        bus.pragma("asynchronous = 1");
        bus.pragma("journal_mode = wal");
    }

    const items = ite.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'items';").get();
    if (!items['count(*)']) {
        ite.prepare("CREATE TABLE items (id TEXT PRIMARY KEY, item TEXT, value INTEGER, rarity DECIMAL(3, 2));").run();
        // Ensure that the "id" row is always unique and indexed.
        ite.prepare("CREATE UNIQUE INDEX idx_items_id ON items (id);").run();
        ite.pragma("asynchronous = 1");
        ite.pragma("journal_mode = wal");
    }

    const useritems = usit.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'useritems';").get();
    if (!useritems['count(*)']) {
        usit.prepare("CREATE TABLE useritems (id TEXT PRIMARY KEY, user TEXT, itemid INTEGER, amount INTEGER);").run();
        usit.prepare("ALTER TABLE useritems ADD FOREIGN KEY (itemid) REFERENCES items (id);").run();
        usit.pragma("asynchronous = 1");
        usit.pragma("journal_mode = wal");
    }

    // Define the infos.sqlite database for the suggestion system
    const suggestion = sent.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'infos';").get();
    if (!suggestion['count(*)']) {
        sent.prepare("CREATE TABLE infos (id TEXT PRIMARY KEY, user TEXT, name INTEGER, suggestions INTEGER);").run();
        sent.pragma("asynchronous = 1");
        sent.pragma("journal_mode = wal");
    }

    // Define the devtool.sqlite database for the todo list
    const dev = tool.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'tool';").get();
    if (!dev['count(*)']) {
        tool.prepare("CREATE TABLE tool (id INTEGER PRIMARY KEY AUTOINCREMENT, todo TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        tool.prepare("CREATE INDEX idx_devtool_id ON tool (id);").run();
        tool.pragma("asynchronous = 1");
        tool.pragma("journal_mode = wal");
    }

    // Define the blockedusers.sqlite database for banned users
    const blocked = ban.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'ban';").get();
    if (!blocked['count(*)']) {
        ban.prepare("CREATE TABLE ban (id TEXT PRIMARY KEY, user TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        ban.prepare("CREATE UNIQUE INDEX idx_blocked_id ON ban (id);").run();
        ban.pragma("asynchronous = 1");
        ban.pragma("journal_mode = wal");
    }
};
