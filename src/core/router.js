const { MessageFlags } = require('discord.js');
const crypto = require('node:crypto');
const registry = require('./registry');
const logger = require('./logger');
const config = require('../config');
const { GameError } = require('./errors');
const { q } = require('../db');
const users = require('../game/users');
const { payload, edit, errorCard } = require('../ui/card');

const SPAM_WINDOW_MS = 1_500;
const lastUse = new Map();

function where(interaction) {
    return interaction.guild ? `#${interaction.channel?.name ?? '?'} @ ${interaction.guild.name}` : 'DM';
}

/** Remembers that a player is active in a server (powers the server leaderboard). */
function seen(interaction) {
    if (!interaction.guildId) return;
    q('INSERT INTO guild_players (guild_id, user_id, seen_at) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM users WHERE id = ?) ON CONFLICT (guild_id, user_id) DO UPDATE SET seen_at = excluded.seen_at')
        .run(interaction.guildId, interaction.user.id, Date.now(), interaction.user.id);
}

async function respondError(interaction, error) {
    let card;
    if (error instanceof GameError) {
        card = errorCard(error.title, error.message, error.emoji);
    } else {
        const ref = crypto.randomBytes(3).toString('hex');
        logger.error(`[${ref}] /${interaction.commandName ?? interaction.customId}:`, error);
        card = errorCard('Something broke', `An unexpected error happened. It has been logged (ref \`${ref}\`).`, '💥');
    }
    const options = payload(card, { ephemeral: true });
    try {
        // Replace a "thinking..." or loading message rather than leave it hanging.
        if ((interaction.deferred && !interaction.replied) || interaction.p1bLoading) await interaction.editReply(edit(card));
        else if (interaction.replied) await interaction.followUp(options);
        else await interaction.reply(options);
    } catch (followError) {
        logger.warn('Could not report an error to the user:', followError.message);
    }
}

async function handleCommand(interaction) {
    const command = registry.commands.get(interaction.commandName);
    if (!command) return respondError(interaction, new GameError('This command no longer exists. Discord may still be catching up.'));

    const ban = users.isBanned(interaction.user.id);
    if (ban) throw new GameError(`You are banned from using this bot.\nReason: ${ban.reason ?? 'none given'}`, { title: 'Banned', emoji: '⛔' });
    if (command.ownerOnly && interaction.user.id !== config.ownerId) throw new GameError('Only the bot owner can use this.', { emoji: '👑' });

    const key = `${interaction.user.id}:${interaction.commandName}`;
    const last = lastUse.get(key) ?? 0;
    if (Date.now() - last < SPAM_WINDOW_MS) throw new GameError('Slow down a little!', { title: 'Easy there', emoji: '🐢' });
    lastUse.set(key, Date.now());

    logger.cmd(`${interaction.user.username} → ${interaction.toString()} [${where(interaction)}]`);
    await command.execute(interaction);
    seen(interaction);
}

async function handleAutocomplete(interaction) {
    const command = registry.commands.get(interaction.commandName);
    if (!command?.autocomplete) return interaction.respond([]);
    try {
        await command.autocomplete(interaction);
    } catch (error) {
        logger.warn(`Autocomplete for /${interaction.commandName} failed:`, error.message);
        if (!interaction.responded) await interaction.respond([]).catch(() => {});
    }
}

async function handleComponent(interaction) {
    const [prefix, key, ...args] = interaction.customId.split(':');
    const handler = prefix === 'p1b' ? registry.components.get(key) : null;
    if (handler) {
        const ban = users.isBanned(interaction.user.id);
        if (ban) throw new GameError(`You are banned from using this bot.\nReason: ${ban.reason ?? 'none given'}`, { title: 'Banned', emoji: '⛔' });
        return handler(interaction, args);
    }
    // Everything else belongs to a collector (or to a button from an older version).
    // If nobody answered, the collector is gone (timeout or restart).
    setTimeout(() => {
        if (interaction.replied || interaction.deferred) return;
        interaction.reply({ content: '⌛ This menu has expired. Run the command again.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }, 2_500).unref();
}

async function handle(interaction) {
    try {
        if (interaction.isAutocomplete()) return await handleAutocomplete(interaction);
        if (interaction.isChatInputCommand()) return await handleCommand(interaction);
        if (interaction.isMessageComponent() || interaction.isModalSubmit()) return await handleComponent(interaction);
    } catch (error) {
        await respondError(interaction, error);
    }
}

// Forget old anti-spam entries now and then.
setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [key, at] of lastUse) if (at < cutoff) lastUse.delete(key);
}, 60_000).unref();

function resetRateLimits() {
    lastUse.clear();
}

module.exports = { handle, respondError, resetRateLimits };
