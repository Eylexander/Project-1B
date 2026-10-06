const { Events } = require('discord.js');
const config = require('../config');
const logger = require('../core/logger');
const mentions = require('../core/mentions');
const { q } = require('../db');
const guilds = require('../game/guilds');
const words = require('../game/words');
const drops = require('../game/drops');
const users = require('../game/users');
const economy = require('../game/economy');
const leveling = require('../game/leveling');
const events = require('../game/events');
const rng = require('../game/rng');
const { Card, payload, edit, button, ButtonStyle } = require('../ui/card');
const theme = require('../ui/theme');
const { relative } = require('../game/format');

const CHAT_REWARD_MS = 60_000;
const LEGACY_PREFIX = '+';
const PREFIX_HINT_MS = 10 * 60_000;

// v1 prefix commands (and their aliases) -> the v2 slash command that replaced them.
// Short aliases like "+me" or "+p" are left out on purpose: people type those in normal chat.
const LEGACY_COMMANDS = {
    inventory: 'inventory', inv: 'inventory', profile: 'profile', balance: 'balance', work: 'work', tryhard: 'work',
    jobs: 'job', job: 'job', compare: 'flex', flex: 'flex', give: 'pay', treasure: 'use', help: 'help', ping: 'ping',
    memes: 'meme', meme: 'meme', cryptoprice: 'crypto', weather: 'weather', meteo: 'weather', userinfo: 'userinfo',
    suggestion: 'suggest', news: 'news', rickroll: 'rickroll',
};
const prefixHintAt = new Map();
const SAFETY_COOLDOWN_MS = 10 * 60_000;
const FUN_COOLDOWN_MS = 30_000;

const chatRewardAt = new Map();
const channelCooldowns = new Map();

function channelReady(key, ms) {
    const last = channelCooldowns.get(key) ?? 0;
    if (Date.now() - last < ms) return false;
    channelCooldowns.set(key, Date.now());
    return true;
}

function safetyCard() {
    return new Card({ title: 'You matter', emoji: '💙', color: theme.info }).lines([
        "If you're having thoughts of suicide, please don't stay alone with them. Talking to someone helps.",
        '',
        '🇫🇷 **3114**: numéro national de prévention du suicide (24/7, gratuit)',
        '🇫🇷 **SOS Amitié**: 09 72 39 40 50',
        '🌍 Anywhere else: find a free, confidential line at https://findahelpline.com',
    ]);
}

function welcomeCard() {
    return new Card({ title: 'Hey, I am Project 1B!', emoji: '👋' }).lines([
        'The race to **$1,000,000,000** starts here.',
        `Start with ${mentions.cmd('profile')}, ${mentions.cmd('daily')} and ${mentions.cmd('work')}.`,
        `Every command is in ${mentions.cmd('help')}.`,
    ]);
}

function dropCard(drop) {
    return new Card({ title: 'A treasure chest washed up!', emoji: '🏝️', color: theme.brand })
        .text(`A ${drop.item.emoji} **${drop.item.name}** is sitting right here. First to grab it keeps it!`)
        .footer(`Disappears ${relative(drop.expires_at)}`)
        .buttons(button(`p1b:drop:${drop.id}`, 'Grab it', { style: ButtonStyle.Success, emoji: '✋' }));
}

async function spawnDrop(message, settings) {
    const drop = drops.maybeSpawn(settings, message.channel.id);
    if (!drop) return;
    const sent = await message.channel.send(payload(dropCard(drop)));
    drops.attachMessage(drop.id, sent.id);
    setTimeout(async () => {
        if (drops.get(drop.id)?.claimed_by) return;
        await sent.edit(edit(new Card({ title: 'The tide took it back', emoji: '🌊', color: theme.muted })
            .text(`Nobody grabbed the ${drop.item.emoji} ${drop.item.name} in time.`))).catch(() => {});
    }, drops.LIFETIME_MS + 1_000).unref();
}

async function chatReward(message) {
    const user = users.get(message.author.id);
    if (!user) return; // only players earn from chatting; nobody gets an account without asking
    const last = chatRewardAt.get(user.id) ?? 0;
    if (Date.now() - last < CHAT_REWARD_MS) return;
    chatRewardAt.set(user.id, Date.now());

    economy.credit(user.id, Math.round(rng.int(15, 40) * events.workMultiplier(user)), 'chat', 'Chatting');
    const { notices } = leveling.addXp(user.id, rng.int(4, 10));
    q('INSERT INTO guild_players (guild_id, user_id, seen_at) VALUES (?, ?, ?) ON CONFLICT (guild_id, user_id) DO UPDATE SET seen_at = excluded.seen_at')
        .run(message.guild.id, user.id, Date.now());
    if (notices.length) {
        await message.reply({ ...payload(new Card({ color: theme.progress }).text(notices.join('\n'))), allowedMentions: { parse: [], repliedUser: false } }).catch(() => {});
    }
}

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        if (message.author.bot || message.system) return;
        const content = message.content ?? '';

        // A v1 tradition: the owner says hey in the dev server, the bot proves it is alive.
        if (content.toLowerCase() === 'hey' && message.author.id === config.ownerId && message.guildId === config.devGuildId) {
            await message.reply({ content: 'I do work for now!', allowedMentions: { repliedUser: false } });
            return;
        }

        if (content.trim() === `<@${client.user.id}>` || content.trim() === `<@!${client.user.id}>`) {
            await message.reply({ ...payload(welcomeCard()), allowedMentions: { parse: [], repliedUser: false } });
            return;
        }

        // People who remember v1 still type "+work": point them to the slash command.
        const legacy = content.startsWith(LEGACY_PREFIX) ? LEGACY_COMMANDS[content.slice(1).split(/\s+/)[0].toLowerCase()] : null;
        if (legacy && Date.now() - (prefixHintAt.get(message.author.id) ?? 0) > PREFIX_HINT_MS) {
            prefixHintAt.set(message.author.id, Date.now());
            await message.reply({ content: `💡 Project 1B uses slash commands now: try ${mentions.cmd(legacy)}. Everything else is in ${mentions.cmd('help')}.`, allowedMentions: { repliedUser: false } }).catch(() => {});
            return;
        }

        if (!message.guild) return;
        const settings = guilds.settings(message.guild.id, message.guild.name);

        try {
            if (settings.safety && content && words.matches('suicide', content) && channelReady(`safety:${message.channel.id}`, SAFETY_COOLDOWN_MS)) {
                await message.channel.send(payload(safetyCard()));
            } else if (settings.fun_replies && content && words.matches('badword', content) && channelReady(`fun:${message.channel.id}`, FUN_COOLDOWN_MS)) {
                const replies = words.get('reply');
                if (replies.length) await message.reply({ content: rng.pick(replies), allowedMentions: { repliedUser: false } });
            }

            if (settings.chat_rewards) await chatReward(message);
            await spawnDrop(message, settings);
        } catch (error) {
            logger.warn(`messageCreate in ${message.guild.name}: ${error.message}`);
        }
    },
};
