const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const player = require('../../core/player');
const prestige = require('../../game/prestige');
const achievements = require('../../game/achievements');
const { announce } = require('../../core/announce');
const { BILLION } = require('../../game/formulas');
const { money, compact, bar, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const { confirm, finish } = require('../../ui/interactive');
const theme = require('../../ui/theme');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prestige')
        .setDescription('Reached $1,000,000,000? Complete Project 1B and start again, stronger.')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const info = prestige.preview(user);
        const explainer = [
            `**Project 1B** · ${compact(info.worth)} / ${compact(BILLION)}`,
            bar(info.worth / BILLION, 20),
            '',
            '**When you prestige:**',
            `♾️ You become **Prestige ${info.next}**: every paycheck, business and chat reward pays **${pct(info.multiplierNext - 1, { digits: 0 })}** more (now ${pct(info.multiplierNow - 1, { digits: 0 })})`,
            `🎰 Your max bet grows`,
            `🏆 You get a **1B Trophy** and your name is announced`,
            `💸 You lose your money, stocks, businesses, listings and items (collectibles stay)`,
            `⭐ You keep your level, job, achievements and badges`,
            `💵 You restart with **${money(info.startingCash)}**`,
        ];

        if (!info.ready) {
            return interaction.reply(payload(new Card({ title: 'Prestige', emoji: '♾️', color: theme.progress })
                .lines(explainer)
                .footer(`You need ${money(BILLION - info.worth)} more net worth.`)));
        }

        const answer = await confirm(interaction, new Card({ title: 'Complete Project 1B?', emoji: '🏆', color: theme.brand }).lines(explainer), { yes: 'Prestige', danger: true });
        if (!answer.ok) return;
        let done = false;
        await finish(answer.click, () => {
            prestige.prestige(user);
            done = true;
            return new Card({ title: `Prestige ${info.next}!`, emoji: '🏆', color: theme.brand })
                .lines([
                    `**${user.username}** reached **${money(info.worth)}** and completed **Project 1B**.`,
                    `Every paycheck now pays **${pct(info.multiplierNext - 1, { digits: 0 })}** more. See you at the top again.`,
                ])
                .notices(achievements.checkUser(user.id));
        });
        if (!done) return;
        await announce(interaction.client, new Card({ title: 'Project 1B completed!', emoji: '🏆', color: theme.brand })
            .text(`**${user.username}** just hit **${money(info.worth)}** and prestiged to **level ${info.next}**. Legend.`));
    },
};
