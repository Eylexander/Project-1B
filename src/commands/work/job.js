const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const mentions = require('../../core/mentions');
const jobs = require('../../game/jobs');
const { money, num } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const { confirm, finish } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const jobChoices = Object.values(jobs.JOBS).map((j) => ({ name: `${j.emoji} ${j.name} (level ${j.level}+)`, value: j.id }));

function payRange(job) {
    return `${money(job.tiers[0].pay)} → ${money(job.tiers[job.tiers.length - 1].pay)}`;
}

function listCard(user) {
    const current = jobs.jobOf(user);
    const card = new Card({ title: 'Job board', emoji: '📋', color: theme.work, subtitle: `You are: ${current.job.emoji} ${current.tier.title}` });
    card.lines(Object.values(jobs.JOBS).map((job) => {
        const blocked = jobs.blocker(user, job);
        const status = user.job_id === job.id ? '✅' : blocked ? '🔒' : '🟢';
        return `${status} ${job.emoji} **${job.name}** · lvl ${job.level}+ · ${payRange(job)} per shift${job.requiresItem ? ' · needs 💻' : ''}${job.requiresBusinesses ? ` · needs ${job.requiresBusinesses} businesses` : ''}`;
    }));
    card.footer(`Pay grows with promotions, level and prestige. Apply with /job apply.`);
    return card;
}

function infoCard(user, job) {
    const card = new Card({ title: job.name, emoji: job.emoji, color: theme.work, subtitle: job.description });
    card.lines(job.tiers.map((tier, i) => {
        const requirement = i === 0 ? `level ${job.level}` : `${tier.shifts} shifts · level ${tier.level}`;
        const mark = user.job_id === job.id && user.job_tier === i ? ' ← you' : '';
        return `**${i + 1}. ${tier.title}** · ${money(tier.pay)}/shift · ${requirement}${mark}`;
    }));
    const blocked = jobs.blocker(user, job);
    card.text(blocked ? `\n🔒 ${blocked}` : user.job_id === job.id ? `\n✅ This is your job. ${num(user.job_shifts)} shifts worked here.` : `\n🟢 You can apply right now.`);
    if (job.image) card.image(job.image);
    if (job.volatile) card.footer('Pay is unpredictable: anywhere from 0.3× to 2.4×.');
    return card;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('job')
        .setDescription('Find, change or quit your job.')
        .addSubcommand((s) => s.setName('list').setDescription('All jobs and what they need.'))
        .addSubcommand((s) => s.setName('info').setDescription('Details and promotions for a job.')
            .addStringOption((o) => o.setName('job').setDescription('Which job').setRequired(true).addChoices(...jobChoices)))
        .addSubcommand((s) => s.setName('apply').setDescription('Get hired.')
            .addStringOption((o) => o.setName('job').setDescription('Which job').setRequired(true).addChoices(...jobChoices)))
        .addSubcommand((s) => s.setName('quit').setDescription('Quit your job (you lose your promotions).'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const sub = interaction.options.getSubcommand();

        if (sub === 'list') return interaction.reply(payload(listCard(user).notices(player.welcome(user))));
        if (sub === 'info') return interaction.reply(payload(infoCard(user, jobs.JOBS[interaction.options.getString('job', true)])));

        if (sub === 'apply') {
            const job = jobs.JOBS[interaction.options.getString('job', true)];
            if (user.job_id && user.job_id !== job.id) {
                const reason = jobs.blocker(user, job);
                if (reason) throw new GameError(reason, { title: `Can't become a ${job.name}`, emoji: '🚫' });
                const current = jobs.jobOf(user);
                const answer = await confirm(interaction, new Card({ title: 'Switch jobs?', emoji: '🔄', color: theme.warning })
                    .text(`You will leave **${current.tier.title}** and start over as a **${job.tiers[0].title}**. Your promotions at ${current.job.name} are lost.`), { yes: 'Switch' });
                if (!answer.ok) return;
                return finish(answer.click, () => {
                    jobs.join(user, job.id);
                    return hiredCard(job);
                });
            }
            jobs.join(user, job.id);
            return interaction.reply(payload(hiredCard(job)));
        }

        if (!user.job_id) throw new GameError("You don't have a job to quit.");
        const answer = await confirm(interaction, new Card({ title: 'Quit your job?', emoji: '🚪', color: theme.warning })
            .text('You will go back to odd jobs and lose your promotions.'), { yes: 'Quit', danger: true });
        if (!answer.ok) return;
        await finish(answer.click, () => {
            const job = jobs.quit(user);
            return new Card({ title: 'You quit', emoji: '🚪', color: theme.muted }).text(`You are no longer a ${job.emoji} ${job.name}. Freedom!`);
        });
    },
};

function hiredCard(job) {
    return new Card({ title: "You're hired!", emoji: '🤝', color: theme.success })
        .lines([
            `Welcome to the team, **${job.tiers[0].title}**. ${job.emoji}`,
            `> ${job.description}`,
            `Start your first shift with ${mentions.cmd('work')}.`,
        ]);
}
