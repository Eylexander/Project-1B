const crypto = require('node:crypto');
const { q } = require('../db');
const { DROPS } = require('../data/loot');
const inventory = require('./inventory');
const guilds = require('./guilds');
const rng = require('./rng');

// Treasure chests that wash up in active chats. First click wins.
// (The v1 bot had a `treasurelist` table for exactly this idea; it finally shipped.)

const CHANCE_PER_MESSAGE = 0.03;
const MIN_GAP_MS = 8 * 60 * 1000;
const LIFETIME_MS = 90 * 1000;

/** Decides whether a message spawns a drop. Returns the drop or null. */
function maybeSpawn(guildSettings, channelId, now = Date.now()) {
    if (!guildSettings.drops) return null;
    if (guildSettings.drop_channel_id && guildSettings.drop_channel_id !== channelId) return null;
    if (guildSettings.last_drop_at && now - guildSettings.last_drop_at < MIN_GAP_MS) return null;
    if (!rng.chance(CHANCE_PER_MESSAGE)) return null;
    return spawn(guildSettings.guild_id, channelId, now);
}

function spawn(guildId, channelId, now = Date.now()) {
    const [chest] = rng.weighted(DROPS);
    const drop = { id: crypto.randomBytes(6).toString('hex'), guild_id: guildId, channel_id: channelId, chest, created_at: now, expires_at: now + LIFETIME_MS };
    q('INSERT INTO drops (id, guild_id, channel_id, chest, created_at, expires_at) VALUES (@id, @guild_id, @channel_id, @chest, @created_at, @expires_at)').run(drop);
    guilds.touch(guildId, 'last_drop_at', now);
    return { ...drop, item: inventory.item(chest) };
}

function attachMessage(dropId, messageId) {
    q('UPDATE drops SET message_id = ? WHERE id = ?').run(messageId, dropId);
}

/** Atomically claims a drop. Returns the drop if this user won it, otherwise a reason. */
function claim(dropId, userId, now = Date.now()) {
    const result = q('UPDATE drops SET claimed_by = ?, claimed_at = ? WHERE id = ? AND claimed_by IS NULL AND expires_at > ?').run(userId, now, dropId, now);
    const drop = q('SELECT * FROM drops WHERE id = ?').get(dropId);
    if (!drop) return { ok: false, reason: 'gone' };
    if (!result.changes) return { ok: false, reason: drop.claimed_by ? 'taken' : 'expired', drop };
    inventory.add(userId, drop.chest, 1);
    return { ok: true, drop, item: inventory.item(drop.chest) };
}

function get(dropId) {
    return q('SELECT * FROM drops WHERE id = ?').get(dropId);
}

module.exports = { maybeSpawn, spawn, attachMessage, claim, get, LIFETIME_MS };
