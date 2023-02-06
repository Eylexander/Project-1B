// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Organize the database in folders
if (!fs.existsSync('./database/economy')) { fs.mkdirSync('./database/economy') };
if (!fs.existsSync('./database/devtools')) { fs.mkdirSync('./database/devtools') };

// Define the database
const db = require("better-sqlite3");

// Define the database for the devtools
const sug = new db('./database/devtools/suggestions.sqlite');
const todo = new db('./database/devtools/todolist.sqlite');
const ban = new db('./database/devtools/bannedusers.sqlite');
const ser = new db('./database/devtools/server.sqlite');

// Define the database for the economy system
const inv = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');
const ite = new db('./database/economy/items.sqlite');
const usit = new db('./database/economy/useritems.sqlite');

exports.initDatabases = function () {
    // Define the business.sqlite database for the economy system
    const business = bus.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'business';").get();
    if (!business['count(*)']) {
        bus.prepare("CREATE TABLE business (id TEXT PRIMARY KEY, business TEXT, salary INTEGER, level INTEGER, description TEXT, image TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        bus.prepare("CREATE UNIQUE INDEX idx_business_id ON business (id);").run();
        bus.pragma("asynchronous = 1");
        bus.pragma("journal_mode = wal");
    }

    const stats = inv.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'stats';").get();
    if (!stats['count(*)']) {
        inv.prepare("CREATE TABLE stats (id TEXT PRIMARY KEY, user TEXT, money INTEGER, mana INTEGER, maxmana INTEGER, businessID INTEGER, level INTEGER, xp INTEGER);").run();
        // Ensure that the "id" row is always unique and indexed.
        inv.prepare("CREATE UNIQUE INDEX idx_stats_id ON stats (id);").run();
        inv.pragma("asynchronous = 1");
        inv.pragma("journal_mode = wal");
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
        usit.pragma("asynchronous = 1");
        usit.pragma("journal_mode = wal");
    }

    

    // Define the infos.sqlite database for the suggestion system
    const suggestions = sug.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'suggestions';").get();
    if (!suggestions['count(*)']) {
        sug.prepare("CREATE TABLE suggestions (id TEXT, user TEXT, name INTEGER, suggestions INTEGER);").run();
        sug.pragma("asynchronous = 1");
        sug.pragma("journal_mode = wal");
    }

    // Define the devtool.sqlite database for the todo list
    const todolist = todo.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'todolist';").get();
    if (!todolist['count(*)']) {
        todo.prepare("CREATE TABLE todolist (id INTEGER PRIMARY KEY AUTOINCREMENT, todo TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        todo.prepare("CREATE INDEX idx_devtool_id ON todolist (id);").run();
        todo.pragma("asynchronous = 1");
        todo.pragma("journal_mode = wal");
    }

    // Define the blockedusers.sqlite database for banned users
    const bannedusers = ban.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'bannedusers';").get();
    if (!bannedusers['count(*)']) {
        ban.prepare("CREATE TABLE bannedusers (id TEXT PRIMARY KEY, user TEXT, reason TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        ban.prepare("CREATE UNIQUE INDEX idx_blocked_id ON bannedusers (id);").run();
        ban.pragma("asynchronous = 1");
        ban.pragma("journal_mode = wal");
    }

    // Define the server.sqlite database for the server settings
    const server = ser.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'server';").get();
    if (!server['count(*)']) {
        ser.prepare("CREATE TABLE server (id TEXT PRIMARY KEY, server TEXT, prefix TEXT, language TEXT);").run();
        // Ensure that the "id" row is always unique and indexed.
        ser.prepare("CREATE UNIQUE INDEX idx_server_id ON server (id);").run();
        ser.pragma("asynchronous = 1");
        ser.pragma("journal_mode = wal");
    }
};
