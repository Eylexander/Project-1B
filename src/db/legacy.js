// One-shot import of the v1 bot data (2018-2024) into the v2 schema.
// Runs as migration 2; the old .sqlite files are only read, never modified.
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const config = require('../config');
const { xpForNext, maxEnergy } = require('../game/formulas');

const LEGACY_JOBS = { designer: 'designer', 'ingénieur': 'ingenieur', ingenieur: 'ingenieur' };

// The original word_libraries.json, kept so a fresh install behaves like v1 did.
const SEED_WORDS = {
    suicide: ['suicide', 'suisid', 'cuisid'],
    badword: ['lussy'],
    reply: [
        'Patate',
        'Oui',
        'Bien et toi ?',
        'Saucisse de Francfort',
        'Wesh wesh, Canne à pêche',
        "C'est pas de ma faute si je suis un peu stupide",
        'Finalement non.',
        'Banques Suisses',
        'Les Carpates',
    ],
    rickroll: [
        'https://media.tenor.com/images/a1505c6e6d37aa2b7c5953741c0177dc/tenor.gif',
        'https://www.icegif.com/wp-content/uploads/rickroll-icegif-4.gif',
        'https://c.tenor.com/qr2UEm4fx3IAAAAM/rickroll-bop.gif',
    ],
};

function openLegacy(relative) {
    const file = path.join(config.legacyDir, relative);
    if (!fs.existsSync(file)) return null;
    try {
        return new Database(file, { readonly: true, fileMustExist: true });
    } catch {
        return null;
    }
}

function tableRows(legacyDb, table) {
    if (!legacyDb) return [];
    const exists = legacyDb.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
    return exists ? legacyDb.prepare(`SELECT * FROM ${table}`).all() : [];
}

function legacyJobs() {
    const business = openLegacy('economy/business.sqlite');
    const map = new Map();
    for (const row of tableRows(business, 'business')) {
        const id = LEGACY_JOBS[String(row.business ?? row.businessName ?? '').toLowerCase()];
        if (id) map.set(String(row.id), id);
    }
    business?.close();
    return map;
}

/** When each v1 player was first seen in the old message logs, so OG profiles show their real start date. */
function firstSeen() {
    const logs = openLegacy('devtools/logs.sqlite');
    const seen = new Map();
    if (!logs) return seen;
    try {
        const columns = logs.prepare('PRAGMA table_info(logs)').all().map((c) => c.name.toLowerCase());
        const rows = columns.includes('year')
            ? logs.prepare('SELECT authorid AS id, MIN(year * 10000 + month * 100 + day) AS d FROM logs GROUP BY authorid').all()
                .map((r) => ({ id: r.id, at: Date.UTC(Math.floor(r.d / 10000), (Math.floor(r.d / 100) % 100) - 1, r.d % 100) }))
            : logs.prepare('SELECT authorID AS id, MIN(timestamp) AS at FROM logs GROUP BY authorID').all();
        for (const row of rows) if (row.id && Number.isFinite(row.at)) seen.set(String(row.id), row.at);
    } catch {
        // Unknown log format: fall back to the import date.
    }
    logs.close();
    return seen;
}

function importPlayers(db) {
    const jobs = legacyJobs();
    const seen = firstSeen();
    const stats = openLegacy('economy/stats.sqlite');
    const inventory = openLegacy('economy/inventory.sqlite');
    const rows = [...tableRows(stats, 'stats'), ...tableRows(inventory, 'inventory')];
    stats?.close();
    inventory?.close();

    const now = Date.now();
    const insert = db.prepare(`
        INSERT OR IGNORE INTO users
            (id, username, wallet, bank, interest_at, xp, level, energy, energy_at, job_id, legacy, lifetime_earned, created_at)
        VALUES
            (@id, @username, 1000, @bank, @now, @xp, @level, @energy, @now, @job, 1, @bank, @since)
    `);
    const og = db.prepare('INSERT OR IGNORE INTO achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)');
    const ledger = db.prepare(`
        INSERT INTO transactions (user_id, amount, account, type, detail, created_at)
        VALUES (?, ?, 'bank', 'legacy', 'Imported from Project 1B v1', ?)
    `);

    let imported = 0;
    for (const row of rows) {
        if (!row.id) continue;
        const level = Math.max(1, Math.min(Number(row.level) || 1, 100));
        // v1 used level^3 * 50 + 250 per level; keep the same progress fraction on the new curve.
        const oldNeed = level ** 3 * 50 + 250;
        const fraction = Math.min((Number(row.xp) || 0) / oldNeed, 0.95);
        const money = Math.max(0, Math.floor(Number(row.money) || 0));
        const result = insert.run({
            id: String(row.id),
            username: String(row.user || 'Unknown').replace(/#\d+$/, ''),
            bank: money,
            xp: Math.floor(fraction * xpForNext(level)),
            level,
            energy: maxEnergy(level),
            job: jobs.get(String(row.businessID)) ?? null,
            now,
            since: Math.min(seen.get(String(row.id)) ?? now, now),
        });
        if (result.changes) {
            og.run(String(row.id), 'og', now);
            if (money > 0) ledger.run(String(row.id), money, now);
            imported++;
        }
    }
    return imported;
}

function importDevtools(db) {
    const bans = openLegacy('devtools/banList.sqlite');
    const insertBan = db.prepare('INSERT OR IGNORE INTO bot_bans (user_id, username, reason, banned_at) VALUES (?, ?, ?, ?)');
    for (const row of tableRows(bans, 'banlist')) insertBan.run(String(row.id), row.user, row.reason, Date.now());
    bans?.close();

    const words = openLegacy('devtools/words.sqlite');
    const insertWord = db.prepare('INSERT OR IGNORE INTO words (type, word) VALUES (?, ?)');
    for (const row of tableRows(words, 'words')) {
        if (row.type && row.word) insertWord.run(row.type === 'badwords' ? 'badword' : row.type, String(row.word).toLowerCase());
    }
    words?.close();

    const suggestions = openLegacy('devtools/suggestions.sqlite');
    const insertSuggestion = db.prepare(`
        INSERT INTO suggestions (user_id, username, title, body, created_at) VALUES (?, ?, ?, ?, ?)
    `);
    for (const row of tableRows(suggestions, 'suggestions')) {
        insertSuggestion.run(String(row.userID ?? row.id), row.user, String(row.name ?? 'Suggestion'), String(row.suggestions ?? ''), Date.now());
    }
    suggestions?.close();

    const servers = openLegacy('devtools/serverList.sqlite');
    const insertGuild = db.prepare('INSERT OR IGNORE INTO guild_settings (guild_id, name) VALUES (?, ?)');
    for (const row of tableRows(servers, 'serverlist')) insertGuild.run(String(row.id), row.server);
    servers?.close();
}

function seedWords(db) {
    const insert = db.prepare('INSERT OR IGNORE INTO words (type, word) VALUES (?, ?)');
    for (const [type, list] of Object.entries(SEED_WORDS)) {
        for (const word of list) insert.run(type, type === 'reply' || type === 'rickroll' ? word : word.toLowerCase());
    }
}

function importAll(db) {
    seedWords(db);
    if (process.env.P1B_SKIP_LEGACY) return;
    const players = importPlayers(db);
    importDevtools(db);
    if (players) console.log(`[legacy] Imported ${players} v1 player(s) with the OG badge.`);
}

module.exports = { importAll, SEED_WORDS };
