const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const config = require('../config');
const migrations = require('./migrations');

let current = null;
let statements = new Map();

function open(file) {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    const db = new Database(file);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    migrate(db);
    return db;
}

function migrate(db) {
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at INTEGER)');
    const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version));
    for (const migration of migrations) {
        if (applied.has(migration.version)) continue;
        db.transaction(() => {
            migration.up(db);
            db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
                .run(migration.version, migration.name, Date.now());
        })();
    }
}

/** The shared connection, opened lazily on first use. */
function db() {
    if (!current) current = open(config.dbPath);
    return current;
}

/** Prepared statements are cached per SQL string. */
function q(sql) {
    let stmt = statements.get(sql);
    if (!stmt) {
        stmt = db().prepare(sql);
        statements.set(sql, stmt);
    }
    return stmt;
}

/** Runs fn inside a transaction (nested calls become savepoints). */
function tx(fn) {
    return db().transaction(fn)();
}

/** Swap the connection, used by tests to run against ':memory:'. */
function useDatabase(file) {
    if (current) current.close();
    statements = new Map();
    current = open(file);
    return current;
}

function close() {
    if (current) current.close();
    current = null;
    statements = new Map();
}

module.exports = { db, q, tx, useDatabase, close };
