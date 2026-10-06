const users = require('../game/users');
const mentions = require('./mentions');
const { GameError } = require('./errors');

/** The player running the command (account created on first use). */
function self(interaction) {
    return users.ensure(interaction.user);
}

/** A player picked in a user option. Bots are refused. */
function target(discordUser, { create = false } = {}) {
    if (discordUser.bot) throw new GameError("Bots don't play. They just watch.", { emoji: '🤖' });
    if (create) return users.ensure(discordUser);
    const user = users.get(discordUser.id);
    if (!user) throw new GameError(`**${users.displayName(discordUser)}** hasn't started playing yet.`, { emoji: '👻' });
    return users.ensure(discordUser);
}

/** Notice line for brand-new players. */
function welcome(user) {
    if (!user.isNew) return [];
    return [`👋 **Welcome to Project 1B!** You got **$500** to start. Claim ${mentions.cmd('daily')}, then ${mentions.cmd('work')}. Everything is in ${mentions.cmd('help')}.`];
}

function avatar(discordUser) {
    return discordUser.displayAvatarURL({ extension: 'png', size: 256 });
}

module.exports = { self, target, welcome, avatar };
