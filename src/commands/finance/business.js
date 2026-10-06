const { SlashCommandBuilder, InteractionContextType, ButtonStyle, MessageFlags } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const businesses = require('../../game/businesses');
const progress = require('../../game/progress');
const users = require('../../game/users');
const { money, compact, relative, bar } = require('../../game/format');
const { HOUR } = require('../../game/formulas');
const { Card, payload, edit, button } = require('../../ui/card');
const { confirm, finish } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const choices = Object.values(businesses.BUSINESSES).map((b) => ({ name: `${b.emoji} ${b.name} (level ${b.level}+, ${compact(b.cost)})`, value: b.id }));

function empireCard(user) {
    const rows = businesses.owned(user.id);
    const perHour = rows.reduce((sum, r) => sum + r.perHour, 0);
    const pending = rows.reduce((sum, r) => sum + r.pending, 0);
    const card = new Card({ title: `${user.username}'s empire`, emoji: '🏢', subtitle: `${rows.length}/${Object.keys(businesses.BUSINESSES).length} businesses · ${money(perHour)}/hour`, color: theme.finance });
    if (!rows.length) {
        return card.text('You don\'t own anything yet. Start small with a 🍋 **Lemonade Stand** for $5,000: `/business buy`.');
    }
    card.lines(rows.map((r) => {
        const fill = Math.min(1, (Date.now() - r.collected_at) / (businesses.STORAGE_HOURS * HOUR));
        return `${r.def.emoji} **${r.def.name}** · lvl ${r.level}/${businesses.MAX_LEVEL} · ${money(r.perHour)}/h\n${bar(fill, 12)} **${money(r.pending)}** waiting${fill >= 1 ? ' · **FULL**' : ` · full ${relative(r.fullAt)}`}`;
    }));
    card.divider().text(`💰 Ready to collect: **${money(pending)}**`);
    card.buttons(button(`p1b:collect:${user.id}`, `Collect ${compact(pending)}`, { style: ButtonStyle.Success, emoji: '💰', disabled: pending <= 0 }));
    return card.footer(`Businesses stop earning after ${businesses.STORAGE_HOURS}h without a collect.`);
}

function catalogCard(user) {
    const owned = new Set(businesses.owned(user.id).map((r) => r.business_id));
    const card = new Card({ title: 'Business directory', emoji: '📒', subtitle: 'Passive income while you sleep', color: theme.finance });
    card.lines(Object.values(businesses.BUSINESSES).map((b) => {
        const status = owned.has(b.id) ? '✅' : user.level < b.level ? '🔒' : '🟢';
        const payback = Math.round(b.cost / b.income);
        return `${status} ${b.emoji} **${b.name}** · ${money(b.cost)} · ${money(b.income)}/h · lvl ${b.level}+ · pays back in ~${payback}h\n-# ${b.flavor}`;
    }));
    return card.footer('Each upgrade adds +60% of base income, up to level 10.');
}

async function collect(interaction, fromButton) {
    const user = player.self(interaction);
    const result = businesses.collect(user.id);
    const notices = progress.after(user.id, { xp: 20, events: { business_collect: 1 } });
    const card = new Card({ title: 'Collected!', emoji: '💰', color: theme.success })
        .lines(result.rows.filter((r) => r.pending > 0).map((r) => `${r.def.emoji} ${r.def.name} · ${money(r.pending)}`))
        .text(`**Total: ${money(result.total)}**`)
        .footer(`Wallet: ${money(users.get(user.id).wallet)}`)
        .notices(notices);
    if (fromButton) {
        await interaction.update(edit(empireCard(users.get(user.id))));
        await interaction.followUp(payload(card, { ephemeral: true }));
    } else {
        await interaction.reply(payload(card));
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('business')
        .setDescription('Own businesses that earn money while you are away.')
        .addSubcommand((s) => s.setName('empire').setDescription('Your businesses and what they have earned.'))
        .addSubcommand((s) => s.setName('directory').setDescription('Every business you can buy.'))
        .addSubcommand((s) => s.setName('buy').setDescription('Open a new business.')
            .addStringOption((o) => o.setName('business').setDescription('Which one').setRequired(true).addChoices(...choices)))
        .addSubcommand((s) => s.setName('upgrade').setDescription('Upgrade a business for more income.')
            .addStringOption((o) => o.setName('business').setDescription('Which one').setRequired(true).addChoices(...choices)))
        .addSubcommand((s) => s.setName('collect').setDescription('Collect income from all your businesses.'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const sub = interaction.options.getSubcommand();
        if (sub === 'empire') return interaction.reply(payload(empireCard(user).notices(player.welcome(user))));
        if (sub === 'directory') return interaction.reply(payload(catalogCard(user)));
        if (sub === 'collect') return collect(interaction, false);

        const id = interaction.options.getString('business', true);
        if (sub === 'buy') {
            const result = businesses.buy(user, id);
            businesses.trackCount(user.id);
            const notices = progress.after(user.id, { xp: 50 });
            return interaction.reply(payload(new Card({ title: 'Grand opening!', emoji: '🎉', color: theme.success })
                .text(`You opened a ${result.def.emoji} **${result.def.name}** for **${money(result.def.cost)}**.\nIt earns **${money(result.def.income)}/hour** to start. Collect with \`/business collect\`.`)
                .notices(notices)));
        }

        const row = businesses.owned(user.id).find((r) => r.business_id === id);
        const def = businesses.BUSINESSES[id];
        if (row && row.nextCost) {
            if (user.wallet + row.pending < row.nextCost) {
                throw new GameError(`Upgrading ${def.emoji} ${def.name} to level ${row.level + 1} costs **${money(row.nextCost)}**. You have ${money(user.wallet)} (+${money(row.pending)} waiting to be collected).`, { title: 'Not enough money', emoji: '💸' });
            }
            const next = businesses.incomePerHour(def, row.level + 1, user.prestige);
            const answer = await confirm(interaction, new Card({ title: `Upgrade ${def.name}?`, emoji: def.emoji, color: theme.warning })
                .text(`Level ${row.level} → **${row.level + 1}** for **${money(row.nextCost)}**.\nIncome ${money(row.perHour)}/h → **${money(next)}/h**.`), { yes: 'Upgrade' });
            if (!answer.ok) return;
            return finish(answer.click, () => {
                const result = businesses.upgrade(user.id, id);
                const notices = progress.after(user.id, { xp: 30 });
                return new Card({ title: 'Upgraded!', emoji: '🏗️', color: theme.success })
                    .text(`${def.emoji} **${def.name}** is now level **${result.level}** and earns **${money(result.perHour)}/hour**.${result.collected ? `\nCollected ${money(result.collected)} that was waiting.` : ''}`)
                    .notices(notices);
            });
        }
        businesses.upgrade(user.id, id); // throws the right error (not owned / max level)
    },

    components: {
        async collect(interaction, [ownerId]) {
            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: 'Nice try, but that is not your empire.', flags: MessageFlags.Ephemeral });
            }
            await collect(interaction, true);
        },
    },
};
