const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const crime = require('../../game/crime');
const progress = require('../../game/progress');
const { money, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rob')
        .setDescription("Try to steal from someone's wallet. Getting caught costs you.")
        .addUserOption((o) => o.setName('user').setDescription('Your victim').setRequired(true))
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const robber = player.self(interaction);
        const victimUser = interaction.options.getUser('user', true);
        player.target(victimUser);
        const result = crime.rob(robber.id, victimUser.id);
        const victim = result.victim;

        if (result.outcome === 'padlock') {
            return interaction.reply(payload(new Card({ title: 'Locked out', emoji: '🔒', color: theme.muted })
                .text(`<@${victim.id}>'s wallet had a 🔒 **Padlock**. You fiddled with it, gave up and walked away.\nTheir padlock broke in the process. A 🧷 Lockpick would have helped.`), { ping: [victim.id] }));
        }

        if (result.outcome === 'success') {
            const notices = progress.after(robber.id, { xp: 25, events: { rob_success: 1 } });
            return interaction.reply(payload(new Card({ title: 'Clean getaway!', emoji: '🦹', color: theme.crime })
                .lines([
                    `You snatched **${money(result.amount)}** from <@${victim.id}>'s wallet!`,
                    result.brokePadlock ? '🧷 Your lockpick made short work of their padlock.' : result.usedLockpick ? '🧷 Your lockpick helped.' : null,
                    `-# Success chance was ${pct(result.chance, { sign: false, digits: 0 })}. Tip for victims: keep your money in the bank.`,
                ])
                .notices(notices), { ping: [victim.id] }));
        }

        const notices = progress.after(robber.id, { events: { rob_fail: 1 } });
        await interaction.reply(payload(new Card({ title: 'Caught red-handed!', emoji: '🚔', color: theme.danger })
            .lines([
                `<@${victim.id}> caught you in the act. You paid them **${money(result.amount)}** in damages.`,
                `-# Success chance was ${pct(result.chance, { sign: false, digits: 0 })}.`,
            ])
            .notices(notices), { ping: [victim.id] }));
    },
};
