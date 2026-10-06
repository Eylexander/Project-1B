const { SlashCommandBuilder, InteractionContextType, AttachmentBuilder } = require('discord.js');
const player = require('../../core/player');
const journey = require('../../game/journey');
const networth = require('../../game/networth');
const { BILLION, DAY } = require('../../game/formulas');
const { money, compact, pct, bar, timestamp } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const charts = require('../../ui/charts');
const theme = require('../../ui/theme');

function forecast(pace, current) {
    if (current >= BILLION) return '🏆 You made it. Time to `/prestige`!';
    if (!pace.days) return '🔮 Come back tomorrow: your first daily snapshot is being recorded.';
    if (!pace.etaDays) return '🔮 Not getting richer this week. The billion will wait.';
    const years = pace.etaDays / 365;
    const when = timestamp(Date.now() + pace.etaDays * DAY, 'D');
    return `🔮 At this pace: **$1B in ${pace.etaDays.toLocaleString('en-US')} days** (${when})${years > 10 ? ". Maybe try the stock market?" : years < 0.25 ? '. The finish line is in sight!' : ''}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('journey')
        .setDescription('Your road to the first billion: net worth history and forecast.')
        .addUserOption((o) => o.setName('user').setDescription("Someone else's journey"))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const me = player.self(interaction);
        const other = interaction.options.getUser('user');
        const user = other && other.id !== me.id ? player.target(other) : me;
        const current = networth.total(user.id);
        const days = journey.history(user.id, 90);
        const values = [...days.map((d) => d.networth), current];
        const pace = journey.pace(user.id, current);
        const chart = days.length ? charts.journeyChart(values, { name: user.username, startLabel: days[0].day }) : null;

        const card = new Card({ title: `${user.username}'s road to 1B`, emoji: '🚀', color: theme.brand });
        if (chart) card.image('attachment://journey.png');
        card.lines([
            `📊 **Net worth** ${money(current)} · ${pct(current / BILLION, { sign: false, digits: 3 })} of the way`,
            bar(current / BILLION, 20),
            pace.days ? `📈 **Last ${Math.round(pace.days)} day${Math.round(pace.days) === 1 ? '' : 's'}** ${pace.perDay >= 0 ? '+' : ''}${compact(pace.perDay)} per day` : null,
            forecast(pace, current),
        ]);
        card.footer(`Net worth is recorded every day at midnight UTC${days.length ? ` · ${days.length} day${days.length === 1 ? '' : 's'} of history` : ''}`);
        await interaction.reply(payload(card, { files: chart ? [new AttachmentBuilder(chart, { name: 'journey.png' })] : [] }));
    },
};
