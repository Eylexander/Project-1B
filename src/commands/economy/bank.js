const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { q, tx } = require('../../db');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const mentions = require('../../core/mentions');
const economy = require('../../game/economy');
const users = require('../../game/users');
const F = require('../../game/formulas');
const { parseAmount } = require('../../game/amount');
const { money, bar, relative, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

function moveMoney(userId, amount, from, to) {
    tx(() => {
        economy.debit(userId, amount, `${to === 'bank' ? 'deposit' : 'withdraw'}`, null, from);
        economy.credit(userId, amount, `${to === 'bank' ? 'deposit' : 'withdraw'}`, null, to);
    });
}

function bankSummary(user) {
    const capacity = F.bankCapacity(user);
    return [
        `💵 Wallet **${money(user.wallet)}**`,
        `🏦 Bank **${money(user.bank)}** / ${money(capacity)}`,
        bar(user.bank / capacity, 16),
    ];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription('Keep your money safe and earn interest.')
        .addSubcommand((s) => s.setName('deposit').setDescription('Move money from your wallet to the bank.')
            .addStringOption((o) => o.setName('amount').setDescription('e.g. 5000, 10k, half, all').setRequired(true)))
        .addSubcommand((s) => s.setName('withdraw').setDescription('Take money out of the bank.')
            .addStringOption((o) => o.setName('amount').setDescription('e.g. 5000, 10k, half, all').setRequired(true)))
        .addSubcommand((s) => s.setName('info').setDescription('Capacity, interest and how to grow your bank.'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const sub = interaction.options.getSubcommand();
        const capacity = F.bankCapacity(user);

        if (sub === 'deposit') {
            const room = Math.max(0, capacity - user.bank);
            if (room === 0) throw new GameError(`Your bank is full (${money(capacity)}). Level up or use a 📜 Bank Note to grow it.`, { emoji: '🏦' });
            const amount = parseAmount(interaction.options.getString('amount'), { available: Math.min(user.wallet, room) });
            if (amount > room) throw new GameError(`Your bank only has room for **${money(room)}** more.`, { emoji: '🏦' });
            moveMoney(user.id, amount, 'wallet', 'bank');
            const fresh = users.get(user.id);
            return interaction.reply(payload(new Card({ title: 'Deposited', emoji: '🏦', color: theme.success })
                .text(`You put **${money(amount)}** in the bank.`)
                .lines(bankSummary(fresh))));
        }

        if (sub === 'withdraw') {
            const amount = parseAmount(interaction.options.getString('amount'), { available: user.bank });
            moveMoney(user.id, amount, 'bank', 'wallet');
            const fresh = users.get(user.id);
            return interaction.reply(payload(new Card({ title: 'Withdrawn', emoji: '💵', color: theme.success })
                .text(`You took **${money(amount)}** out of the bank.`)
                .lines(bankSummary(fresh))
                .footer('Careful: money in your wallet can be robbed.')));
        }

        const insured = Math.min(user.bank, capacity);
        const daily = Math.floor(insured * F.BANK_INTEREST_DAILY);
        const earned = q("SELECT COALESCE(SUM(amount), 0) AS v FROM transactions WHERE user_id = ? AND type = 'interest'").get(user.id).v;
        await interaction.reply(payload(new Card({ title: 'Banque Project 1B', emoji: '🏦', color: theme.finance })
            .lines(bankSummary(user))
            .divider()
            .lines([
                `📈 **Interest** ${pct(F.BANK_INTEREST_DAILY, { sign: false, digits: 1 })} per day on up to your capacity, paid hourly`,
                `≈ **${money(daily)}** per day right now · **${money(earned)}** earned so far`,
                `⏱️ Next payout ${relative(user.interest_at + F.HOUR)}`,
                '',
                `**Capacity** = $25,000 + $10,000 per level + bank notes`,
                `Grow it by levelling up or using a 📜 **Bank Note** (${mentions.cmd('shop')}).`,
            ])));
    },
};
