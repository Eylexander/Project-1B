const { q } = require('../db');
const config = require('../config');

const EDITABLE = new Set(['chat_rewards', 'drops', 'drop_channel_id', 'announce_channel_id', 'safety', 'fun_replies']);

/** Settings for a server, created with defaults on first use (the dev server gets every feature on). */
function settings(guildId, name = null) {
    let row = q('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!row) {
        const dev = guildId === config.devGuildId ? 1 : 0;
        q('INSERT INTO guild_settings (guild_id, name, drops, fun_replies) VALUES (?, ?, ?, ?)').run(guildId, name, dev, dev);
        row = q('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    } else if (name && row.name !== name) {
        q('UPDATE guild_settings SET name = ? WHERE guild_id = ?').run(name, guildId);
    }
    return row;
}

function update(guildId, key, value) {
    if (!EDITABLE.has(key)) throw new Error(`Setting ${key} is not editable`);
    settings(guildId);
    q(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
    return settings(guildId);
}

function touch(guildId, key, now = Date.now()) {
    if (!['last_drop_at', 'last_heist_at'].includes(key)) throw new Error(`Unknown timestamp ${key}`);
    q(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`).run(now, guildId);
}

function announceChannels() {
    return q('SELECT guild_id, announce_channel_id FROM guild_settings WHERE announce_channel_id IS NOT NULL').all();
}

module.exports = { settings, update, touch, announceChannels };
