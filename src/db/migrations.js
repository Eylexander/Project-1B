const legacy = require('./legacy');

// Append-only: never edit a migration that has shipped, add a new one instead.
module.exports = [
    {
        version: 1,
        name: 'v2 schema',
        up(db) {
            db.exec(`
                CREATE TABLE users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL DEFAULT 'Unknown',
                    wallet INTEGER NOT NULL DEFAULT 0,
                    bank INTEGER NOT NULL DEFAULT 0,
                    bank_bonus INTEGER NOT NULL DEFAULT 0,
                    interest_at INTEGER NOT NULL,
                    xp INTEGER NOT NULL DEFAULT 0,
                    level INTEGER NOT NULL DEFAULT 1,
                    energy INTEGER NOT NULL DEFAULT 100,
                    energy_at INTEGER NOT NULL,
                    job_id TEXT,
                    job_tier INTEGER NOT NULL DEFAULT 0,
                    job_shifts INTEGER NOT NULL DEFAULT 0,
                    prestige INTEGER NOT NULL DEFAULT 0,
                    daily_streak INTEGER NOT NULL DEFAULT 0,
                    daily_at INTEGER,
                    weekly_at INTEGER,
                    passive INTEGER NOT NULL DEFAULT 0,
                    passive_at INTEGER,
                    lifetime_earned INTEGER NOT NULL DEFAULT 0,
                    legacy INTEGER NOT NULL DEFAULT 0,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    amount INTEGER NOT NULL,
                    account TEXT NOT NULL,
                    type TEXT NOT NULL,
                    detail TEXT,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX idx_tx_user ON transactions (user_id, created_at);
                CREATE INDEX idx_tx_time ON transactions (created_at);

                CREATE TABLE cooldowns (
                    user_id TEXT NOT NULL,
                    key TEXT NOT NULL,
                    expires_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, key)
                );

                CREATE TABLE inventory (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    item_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    durability INTEGER,
                    PRIMARY KEY (user_id, item_id)
                );

                CREATE TABLE boosts (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    boost TEXT NOT NULL,
                    expires_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, boost)
                );

                CREATE TABLE stats (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    key TEXT NOT NULL,
                    value INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (user_id, key)
                );

                CREATE TABLE achievements (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    achievement_id TEXT NOT NULL,
                    unlocked_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, achievement_id)
                );

                CREATE TABLE quests (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    day TEXT NOT NULL,
                    slot INTEGER NOT NULL,
                    quest_id TEXT NOT NULL,
                    target INTEGER NOT NULL,
                    progress INTEGER NOT NULL DEFAULT 0,
                    reward_money INTEGER NOT NULL,
                    reward_xp INTEGER NOT NULL,
                    completed_at INTEGER,
                    PRIMARY KEY (user_id, day, slot)
                );

                CREATE TABLE businesses (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    business_id TEXT NOT NULL,
                    level INTEGER NOT NULL DEFAULT 1,
                    invested INTEGER NOT NULL DEFAULT 0,
                    collected_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, business_id)
                );

                CREATE TABLE stocks (
                    symbol TEXT PRIMARY KEY,
                    price INTEGER NOT NULL,
                    fair INTEGER NOT NULL,
                    open_price INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );

                CREATE TABLE stock_history (
                    symbol TEXT NOT NULL,
                    ts INTEGER NOT NULL,
                    price INTEGER NOT NULL,
                    PRIMARY KEY (symbol, ts)
                );

                CREATE TABLE holdings (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    symbol TEXT NOT NULL,
                    shares INTEGER NOT NULL,
                    cost INTEGER NOT NULL,
                    PRIMARY KEY (user_id, symbol)
                );

                CREATE TABLE stock_news (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    headline TEXT NOT NULL,
                    change REAL NOT NULL,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE market_listings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    seller_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    item_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    price INTEGER NOT NULL,
                    created_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX idx_market_item ON market_listings (item_id, price);

                CREATE TABLE lottery_draws (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    seed INTEGER NOT NULL,
                    draws_at INTEGER NOT NULL,
                    winner_id TEXT,
                    pot INTEGER,
                    tickets INTEGER,
                    drawn_at INTEGER
                );

                CREATE TABLE lottery_tickets (
                    draw_id INTEGER NOT NULL REFERENCES lottery_draws (id),
                    user_id TEXT NOT NULL,
                    tickets INTEGER NOT NULL,
                    PRIMARY KEY (draw_id, user_id)
                );

                CREATE TABLE drops (
                    id TEXT PRIMARY KEY,
                    guild_id TEXT NOT NULL,
                    channel_id TEXT NOT NULL,
                    message_id TEXT,
                    chest TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL,
                    claimed_by TEXT,
                    claimed_at INTEGER
                );

                CREATE TABLE guild_settings (
                    guild_id TEXT PRIMARY KEY,
                    name TEXT,
                    chat_rewards INTEGER NOT NULL DEFAULT 1,
                    drops INTEGER NOT NULL DEFAULT 0,
                    drop_channel_id TEXT,
                    announce_channel_id TEXT,
                    safety INTEGER NOT NULL DEFAULT 1,
                    fun_replies INTEGER NOT NULL DEFAULT 0,
                    last_drop_at INTEGER,
                    last_heist_at INTEGER
                );

                CREATE TABLE bot_bans (
                    user_id TEXT PRIMARY KEY,
                    username TEXT,
                    reason TEXT,
                    banned_at INTEGER NOT NULL
                );

                CREATE TABLE words (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    word TEXT NOT NULL,
                    UNIQUE (type, word)
                );

                CREATE TABLE suggestions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    username TEXT,
                    title TEXT NOT NULL,
                    body TEXT,
                    status TEXT NOT NULL DEFAULT 'open',
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE guild_players (
                    guild_id TEXT NOT NULL,
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    seen_at INTEGER NOT NULL,
                    PRIMARY KEY (guild_id, user_id)
                );

                CREATE TABLE state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);
        },
    },
    {
        version: 2,
        name: 'import v1 data',
        up(db) {
            legacy.importAll(db);
        },
    },
    {
        version: 3,
        name: 'daily net worth snapshots',
        up(db) {
            db.exec(`
                CREATE TABLE networth_history (
                    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
                    day TEXT NOT NULL,
                    networth INTEGER NOT NULL,
                    PRIMARY KEY (user_id, day)
                );
                CREATE INDEX idx_networth_day ON networth_history (day);
            `);
        },
    },
];
