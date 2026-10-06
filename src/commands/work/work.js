const { SlashCommandBuilder, InteractionContextType, ButtonStyle, MessageFlags } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const mentions = require('../../core/mentions');
const users = require('../../game/users');
const jobs = require('../../game/jobs');
const economy = require('../../game/economy');
const cooldowns = require('../../game/cooldowns');
const events = require('../../game/events');
const progress = require('../../game/progress');
const minigames = require('../../game/minigames');
const { money, relative, duration, num } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const { nonce, awaitClick, send } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const COOLDOWN = 30;
const ANSWER_MS = 15_000;

function tiredError(user, cost) {
    const info = users.energyInfo(user);
    return new GameError(
        `A shift costs **${cost}** ⚡ but you have **${info.energy}/${info.max}**.\nYou regain 1 energy per minute (full ${relative(info.fullAt ?? Date.now())}), or drink a ☕ Coffee / 🥤 Energy Drink with \`/use\`.`,
        { title: 'Too tired to work', emoji: '🪫' },
    );
}

/** Runs a shift. Works from the slash command and from the "Work again" button. */
async function runShift(interaction, shifts, fromButton = false) {
    const user = player.self(interaction);
    const { job } = jobs.jobOf(user);
    if (user.job_id) {
        const reason = jobs.blocker(user, job);
        if (reason) throw new GameError(`${reason}\nYou can't work as a ${job.name} right now. Fix that, or switch with ${mentions.cmd('job', 'list')}.`, { emoji: job.emoji });
    }

    const now = Date.now();
    const left = cooldowns.remaining(user.id, 'work', now);
    if (left) throw new GameError(`Take a breather. You can work again ${relative(now + left)} (${duration(left)}).`, { title: 'On break', emoji: '☕' });
    const cost = jobs.SHIFT_ENERGY * shifts;
    if (!users.spendEnergy(user.id, cost, now)) throw tiredError(user, cost);
    cooldowns.set(user.id, 'work', COOLDOWN, now);

    const game = minigames.forJob(job);
    const id = nonce();
    const challenge = new Card({ title: `${job.name} shift${shifts > 1 ? ` ×${shifts}` : ''}`, emoji: job.emoji, color: theme.work })
        .text(game.prompt)
        .footer(`Answer within ${ANSWER_MS / 1000}s for a bonus`)
        .buttons(game.options.map((option, i) => button(`${id}:${i}`, option, { style: ButtonStyle.Primary })));

    let message;
    if (fromButton) {
        await interaction.update(edit(challenge));
        message = interaction.message;
    } else {
        message = await send(interaction, payload(challenge));
    }

    const click = await awaitClick(message, user.id, { time: ANSWER_MS, prefix: id });
    const picked = click ? Number(click.customId.split(':').pop()) : null;
    const performance = picked === null ? 'slacked' : picked === game.answer ? 'great' : 'sloppy';

    const result = jobs.completeShifts(user.id, shifts, performance);
    economy.credit(user.id, result.pay, 'work', `${shifts}× ${result.tier.title}`);
    const notices = progress.after(user.id, { xp: result.xp, events: { work: shifts, energy_spent: cost } });
    if (result.promotedTo) notices.unshift(`📈 **Promotion!** You are now a **${result.promotedTo.title}** (base pay ${money(result.promotedTo.pay)}/shift).`);

    const after = users.get(user.id);
    const energy = users.energyInfo(after);
    const next = jobs.nextPromotion(after);
    const golden = events.goldenHourUntil();

    const card = new Card({ title: `${result.perf.emoji} ${result.perf.label}`, color: performance === 'great' ? theme.success : performance === 'slacked' ? theme.muted : theme.work })
        .lines([
            picked !== null && picked !== game.answer ? `The answer was **${game.options[game.answer]}**.` : null,
            `${job.emoji} You worked ${shifts > 1 ? `**${shifts}** shifts ` : ''}as a **${result.tier.title}** and earned **${money(result.pay)}** and **${num(result.xp)} XP**.`,
            job.volatile ? (result.swing > 1.5 ? '📈 Chat was on fire today!' : result.swing < 0.6 ? '📉 Three viewers. One was a bot.' : null) : null,
            golden ? `✨ Golden Hour bonus active (×2) until ${relative(golden)}` : null,
        ])
        .footer(`⚡ ${energy.energy}/${energy.max} energy${next ? ` · next promotion: ${next.tier.title} in ${next.shiftsLeft} shifts${user.level < next.levelNeeded ? ` at level ${next.levelNeeded}` : ''}` : ''}`)
        .notices([...player.welcome(user), ...notices])
        .buttons(button(`p1b:work:${user.id}:${shifts}`, 'Work again', { style: ButtonStyle.Secondary, emoji: '🔁' }));

    if (click) await click.update(edit(card));
    else await interaction.editReply(edit(card));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work a shift at your job. Answer the mini-game for a bonus!')
        .addIntegerOption((o) => o.setName('shifts').setDescription(`Work several shifts at once (${jobs.SHIFT_ENERGY} energy each)`).setMinValue(1).setMaxValue(jobs.MAX_SHIFTS))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        await runShift(interaction, interaction.options.getInteger('shifts') ?? 1);
    },

    components: {
        async work(interaction, [ownerId, shifts]) {
            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: 'Get your own job! Use `/work`.', flags: MessageFlags.Ephemeral });
            }
            await runShift(interaction, Number(shifts) || 1, true);
        },
    },
};
