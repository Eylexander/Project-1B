const { MessageFlags } = require('discord.js');
const drops = require('../game/drops');
const users = require('../game/users');
const progress = require('../game/progress');
const { Card, edit } = require('../ui/card');
const theme = require('../ui/theme');
const mentions = require('../core/mentions');

// "Grab it" button on treasure drops: p1b:drop:<id>
module.exports = {
    key: 'drop',
    async handle(interaction, [dropId]) {
        const user = users.ensure(interaction.user);
        const result = drops.claim(dropId, user.id);
        if (!result.ok) {
            const text = result.reason === 'taken' ? 'Too slow! Someone already grabbed it.' : 'This chest is gone.';
            return interaction.reply({ content: `🏃 ${text}`, flags: MessageFlags.Ephemeral });
        }
        const notices = progress.after(user.id, { xp: 25, events: { drop_claim: 1 } });
        const card = new Card({ title: 'Treasure claimed!', emoji: '🏴‍☠️', color: theme.success })
            .text(`<@${user.id}> grabbed the ${result.item.emoji} **${result.item.name}**!${user.isNew ? '\nWelcome to Project 1B, that is a nice first find.' : ''}`)
            .footer(`Open it with /use`)
            .notices(notices);
        await interaction.update(edit(card));
        if (user.isNew) {
            await interaction.followUp({ content: `👋 Welcome! You start with $500. Try ${mentions.cmd('daily')}, ${mentions.cmd('work')} and ${mentions.cmd('help')}.`, flags: MessageFlags.Ephemeral });
        }
    },
};
