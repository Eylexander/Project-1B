const { SlashCommandBuilder, InteractionContextType, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const { setTimeout: sleep } = require('node:timers/promises');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const users = require('../../game/users');
const economy = require('../../game/economy');
const crime = require('../../game/crime');
const guilds = require('../../game/guilds');
const cooldowns = require('../../game/cooldowns');
const progress = require('../../game/progress');
const { money, relative, pct } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const { nonce, send } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const running = new Set(); // guild ids with a heist in progress

/** Checks a player can join and takes their entry fee. Throws a GameError otherwise. */
function enlist(discordUser) {
    const user = users.ensure(discordUser);
    if (users.isBanned(user.id)) throw new GameError('You are banned from using this bot.');
    if (user.passive) throw new GameError('You are in passive mode. Turn it off with `/passive off` to join heists.', { emoji: '🕊️' });
    const left = cooldowns.remaining(user.id, 'heist');
    if (left) throw new GameError(`You're still laying low after your last heist. Try again ${relative(Date.now() + left)}.`, { emoji: '🕶️' });
    economy.debit(user.id, crime.HEIST.entry, 'heist_entry', 'Heist crew entry');
    cooldowns.set(user.id, 'heist', crime.HEIST.userCooldown);
    return user;
}

function lobbyCard(crew, endsAt, id) {
    const chance = crime.heistChance(crew.length);
    return new Card({ title: 'Heist on the Banque Suisse vault', emoji: '🏦', subtitle: `Entry ${money(crime.HEIST.entry)} · up to ${crime.HEIST.maxCrew} robbers`, color: theme.crime })
        .lines([
            `**Crew (${crew.length}):** ${crew.map((u) => `<@${u.id}>`).join(', ')}`,
            `Success chance: **${pct(chance, { sign: false, digits: 0 })}** · more crew = better odds and a bigger vault`,
            `Leaving ${relative(endsAt)}`,
        ])
        .buttons(button(`${id}:join`, 'Join the crew', { style: ButtonStyle.Danger, emoji: '🦹', disabled: crew.length >= crime.HEIST.maxCrew }));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('heist')
        .setDescription('Plan a bank heist. Everyone in the channel has 60 seconds to join your crew.')
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const guildId = interaction.guildId;
        if (running.has(guildId)) throw new GameError('A heist is already being planned here. Join that one!', { emoji: '🦹' });
        const settings = guilds.settings(guildId, interaction.guild?.name);
        const since = Date.now() - (settings.last_heist_at ?? 0);
        if (since < crime.HEIST.guildCooldown) {
            throw new GameError(`The police are still patrolling after the last heist. Next one ${relative(Date.now() + crime.HEIST.guildCooldown - since)}.`, { emoji: '🚓' });
        }

        player.self(interaction);
        const leader = enlist(interaction.user);
        running.add(guildId);
        guilds.touch(guildId, 'last_heist_at');

        try {
            const crew = [leader];
            const id = nonce();
            const endsAt = Date.now() + crime.HEIST.joinSeconds * 1000;
            const message = await send(interaction, payload(lobbyCard(crew, endsAt, id)));

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: crime.HEIST.joinSeconds * 1000,
                filter: (i) => i.customId === `${id}:join`,
            });
            collector.on('collect', async (i) => {
                if (crew.some((u) => u.id === i.user.id)) {
                    return i.reply({ content: "You're already in the crew. Sit tight.", flags: MessageFlags.Ephemeral });
                }
                if (crew.length >= crime.HEIST.maxCrew) return i.reply({ content: 'The crew is full.', flags: MessageFlags.Ephemeral });
                try {
                    crew.push(enlist(i.user));
                    await i.update(edit(lobbyCard(crew, endsAt, id)));
                } catch (error) {
                    await i.reply({ content: `❌ ${error instanceof GameError ? error.message : 'Could not join.'}`, flags: MessageFlags.Ephemeral });
                }
            });
            await new Promise((resolve) => collector.once('end', resolve));

            await interaction.editReply(edit(new Card({ title: 'The heist is on!', emoji: '🚐', color: theme.crime })
                .text(`${crew.map((u) => `<@${u.id}>`).join(', ')} pull up to the vault...\n🔦 *Drilling... alarms... running...*`)));
            await sleep(2_500);

            const result = crime.resolveHeist(crew.map((u) => u.id));
            const allNotices = [];
            for (const member of crew) {
                const notices = progress.after(member.id, { xp: result.success ? 80 : 20, events: { heist_success: result.success ? 1 : 0 } });
                if (notices.length) allNotices.push(`<@${member.id}>: ${notices.join(' ')}`);
            }

            const card = result.success
                ? new Card({ title: 'Heist successful!', emoji: '💰', color: theme.success })
                    .lines([
                        `The crew cracked the vault and got away with **${money(result.vault)}**!`,
                        `Each member gets **${money(result.share)}** (plus their entry back).`,
                        `-# Odds were ${pct(result.chance, { sign: false, digits: 0 })}.`,
                    ])
                : new Card({ title: 'Busted!', emoji: '🚔', color: theme.danger })
                    .lines([
                        'The alarm went off and the crew scattered. Entry fees are gone.',
                        result.arrested.length ? `🚓 Arrested: ${result.arrested.map((a) => `<@${a.id}> (bail ${money(a.bail)})`).join(', ')}` : 'Everybody escaped, at least.',
                        `-# Odds were ${pct(result.chance, { sign: false, digits: 0 })}.`,
                    ]);
            await interaction.editReply(edit(card.notices(allNotices)));
        } finally {
            running.delete(guildId);
        }
    },
};
