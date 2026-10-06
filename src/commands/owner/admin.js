const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { q, tx } = require('../../db');
const { GameError } = require('../../core/errors');
const { deploy } = require('../../core/deploy');
const mentions = require('../../core/mentions');
const users = require('../../game/users');
const economy = require('../../game/economy');
const inventory = require('../../game/inventory');
const events = require('../../game/events');
const lottery = require('../../game/lottery');
const stocks = require('../../game/stocks');
const drops = require('../../game/drops');
const words = require('../../game/words');
const networth = require('../../game/networth');
const { parseAmount } = require('../../game/amount');
const { money, relative, itemLabel, num } = require('../../game/format');
const { Card, payload, edit, button, ButtonStyle } = require('../../ui/card');
const { confirm, finish, loading } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const ok = (text) => new Card({ title: 'Done', emoji: '👑', color: theme.success }).text(text);

const data = new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Bot owner tools.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((g) => g.setName('money').setDescription('Change balances')
        .addSubcommand((s) => s.setName('give').setDescription('Add money').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
            .addStringOption((o) => o.setName('amount').setDescription('e.g. 1m').setRequired(true))
            .addStringOption((o) => o.setName('account').setDescription('wallet or bank').addChoices({ name: 'wallet', value: 'wallet' }, { name: 'bank', value: 'bank' })))
        .addSubcommand((s) => s.setName('take').setDescription('Remove money').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
            .addStringOption((o) => o.setName('amount').setDescription('e.g. 1m, all').setRequired(true))
            .addStringOption((o) => o.setName('account').setDescription('wallet or bank').addChoices({ name: 'wallet', value: 'wallet' }, { name: 'bank', value: 'bank' }))))
    .addSubcommandGroup((g) => g.setName('item').setDescription('Hand out items')
        .addSubcommand((s) => s.setName('give').setDescription('Give items').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
            .addStringOption((o) => o.setName('item').setDescription('Item').setRequired(true).setAutocomplete(true))
            .addIntegerOption((o) => o.setName('quantity').setDescription('How many').setMinValue(1))))
    .addSubcommandGroup((g) => g.setName('player').setDescription('Inspect or reset players')
        .addSubcommand((s) => s.setName('inspect').setDescription('Raw data for a player').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true)))
        .addSubcommand((s) => s.setName('level').setDescription('Set a level').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))
            .addIntegerOption((o) => o.setName('level').setDescription('New level').setRequired(true).setMinValue(1).setMaxValue(200)))
        .addSubcommand((s) => s.setName('reset').setDescription('Wipe a player completely').addUserOption((o) => o.setName('user').setDescription('Player').setRequired(true))))
    .addSubcommandGroup((g) => g.setName('event').setDescription('Run events')
        .addSubcommand((s) => s.setName('golden-hour').setDescription('Double work pay for everyone')
            .addIntegerOption((o) => o.setName('minutes').setDescription('Duration').setMinValue(1).setMaxValue(240)))
        .addSubcommand((s) => s.setName('drop').setDescription('Spawn a treasure drop in this channel'))
        .addSubcommand((s) => s.setName('lottery-draw').setDescription('Draw the lottery now'))
        .addSubcommand((s) => s.setName('stocks-tick').setDescription('Advance the stock market')
            .addIntegerOption((o) => o.setName('ticks').setDescription('How many 5-minute steps').setMinValue(1).setMaxValue(100))))
    .addSubcommandGroup((g) => g.setName('ban').setDescription('Bot bans')
        .addSubcommand((s) => s.setName('add').setDescription('Ban from the bot').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
            .addStringOption((o) => o.setName('reason').setDescription('Why')))
        .addSubcommand((s) => s.setName('remove').setDescription('Unban').addUserOption((o) => o.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand((s) => s.setName('list').setDescription('All bans')))
    .addSubcommandGroup((g) => g.setName('words').setDescription('Trigger words')
        .addSubcommand((s) => s.setName('add').setDescription('Add a word').addStringOption((o) => o.setName('type').setDescription('List').setRequired(true).addChoices(...words.TYPES.map((t) => ({ name: t, value: t }))))
            .addStringOption((o) => o.setName('word').setDescription('Word, reply or gif URL').setRequired(true)))
        .addSubcommand((s) => s.setName('remove').setDescription('Remove a word').addStringOption((o) => o.setName('type').setDescription('List').setRequired(true).addChoices(...words.TYPES.map((t) => ({ name: t, value: t }))))
            .addStringOption((o) => o.setName('word').setDescription('Word').setRequired(true)))
        .addSubcommand((s) => s.setName('list').setDescription('Show all lists')))
    .addSubcommandGroup((g) => g.setName('bot').setDescription('Bot maintenance')
        .addSubcommand((s) => s.setName('suggestions').setDescription('Open suggestions'))
        .addSubcommand((s) => s.setName('deploy').setDescription('Re-register slash commands')
            .addStringOption((o) => o.setName('scope').setDescription('Where').setRequired(true)
                .addChoices({ name: 'dev guild', value: 'guild' }, { name: 'global', value: 'global' }, { name: 'clear global', value: 'clear-global' }))));

module.exports = {
    data,

    async autocomplete(interaction) {
        await interaction.respond(inventory.choices(interaction.options.getFocused()));
    },

    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const sub = interaction.options.getSubcommand();
        const discordUser = interaction.options.getUser('user');
        const reply = (card) => interaction.reply(payload(card, { ephemeral: true }));

        if (group === 'money') {
            const user = users.ensure(discordUser);
            const account = interaction.options.getString('account') ?? 'wallet';
            const amount = parseAmount(interaction.options.getString('amount', true), { available: user[account] });
            if (sub === 'give') economy.credit(user.id, amount, 'admin', `Given by ${interaction.user.username}`, account);
            else economy.debit(user.id, amount, 'admin', `Taken by ${interaction.user.username}`, account);
            const after = users.get(user.id);
            return reply(ok(`${sub === 'give' ? 'Gave' : 'Took'} **${money(amount)}** ${sub === 'give' ? 'to' : 'from'} ${user.username}'s ${account}. Now: wallet ${money(after.wallet)}, bank ${money(after.bank)}.`));
        }

        if (group === 'item') {
            const user = users.ensure(discordUser);
            const item = inventory.requireItem(interaction.options.getString('item', true));
            const quantity = interaction.options.getInteger('quantity') ?? 1;
            inventory.add(user.id, item.id, quantity);
            return reply(ok(`Gave ${itemLabel(item, quantity)} to ${user.username}.`));
        }

        if (group === 'player') {
            const user = users.get(discordUser.id);
            if (!user) throw new GameError('That user has no account.');
            if (sub === 'inspect') {
                const worth = networth.breakdown(user.id);
                const recent = q('SELECT * FROM transactions WHERE user_id = ? ORDER BY id DESC LIMIT 8').all(user.id);
                return reply(new Card({ title: `Inspect ${user.username}`, emoji: '🔎', color: theme.info })
                    .text(`\`\`\`json\n${JSON.stringify({ ...user, networth: worth }, null, 1).slice(0, 1500)}\n\`\`\``)
                    .lines(recent.map((t) => `\`${t.type}\` ${money(t.amount)} ${t.detail ?? ''} ${relative(t.created_at)}`)));
            }
            if (sub === 'level') {
                const level = interaction.options.getInteger('level', true);
                q('UPDATE users SET level = ?, xp = 0 WHERE id = ?').run(level, user.id);
                return reply(ok(`${user.username} is now level ${level}.`));
            }
            const answer = await confirm(interaction, new Card({ title: `Wipe ${user.username}?`, emoji: '🗑️', color: theme.danger })
                .text('Deletes their account, items, businesses, stocks, listings and achievements. Their ledger history stays. This cannot be undone.'), { yes: 'Wipe', danger: true, ephemeral: true });
            if (!answer.ok) return;
            return finish(answer.click, () => {
                tx(() => q('DELETE FROM users WHERE id = ?').run(user.id));
                return ok(`${user.username} was wiped.`);
            });
        }

        if (group === 'event') {
            if (sub === 'golden-hour') {
                const until = events.startGoldenHour(interaction.options.getInteger('minutes') ?? 30);
                return reply(ok(`✨ Golden Hour running until ${relative(until)}.`));
            }
            if (sub === 'drop') {
                if (!interaction.guildId) throw new GameError('Run this in a server channel.');
                const drop = drops.spawn(interaction.guildId, interaction.channelId);
                const message = await interaction.channel.send(payload(new Card({ title: 'A treasure chest washed up!', emoji: '🏝️', color: theme.brand })
                    .text(`A ${drop.item.emoji} **${drop.item.name}** is sitting right here. First to grab it keeps it!`)
                    .footer(`Disappears ${relative(drop.expires_at)}`)
                    .buttons(button(`p1b:drop:${drop.id}`, 'Grab it', { style: ButtonStyle.Success, emoji: '✋' }))));
                drops.attachMessage(drop.id, message.id);
                return reply(ok('Drop spawned.'));
            }
            if (sub === 'lottery-draw') {
                const result = lottery.drawIfDue(Date.now(), true);
                return reply(ok(result?.winner ? `Draw #${result.draw.id}: <@${result.winner}> won ${money(result.draw.pot)}.` : 'Nobody had tickets; the seed rolled over.'));
            }
            const ticks = interaction.options.getInteger('ticks') ?? 1;
            const news = [];
            const now = Date.now();
            for (let i = ticks - 1; i >= 0; i--) news.push(...stocks.tick(now - i * stocks.TICK_MS));
            return reply(ok(`Advanced the market ${ticks} step(s).${news.length ? `\n${news.map((n) => `📰 ${n.symbol}: ${n.headline}`).join('\n')}` : ''}`));
        }

        if (group === 'ban') {
            if (sub === 'list') {
                const bans = q('SELECT * FROM bot_bans ORDER BY banned_at DESC').all();
                return reply(new Card({ title: 'Bot bans', emoji: '⛔', color: theme.danger }).lines(bans.length ? bans.map((b) => `<@${b.user_id}> (${b.username ?? '?'}) · ${b.reason ?? 'no reason'} · ${relative(b.banned_at)}`) : ['Nobody is banned.']));
            }
            if (sub === 'add') {
                q('INSERT OR REPLACE INTO bot_bans (user_id, username, reason, banned_at) VALUES (?, ?, ?, ?)').run(discordUser.id, discordUser.username, interaction.options.getString('reason'), Date.now());
                return reply(ok(`${discordUser.username} is banned from the bot.`));
            }
            const removed = q('DELETE FROM bot_bans WHERE user_id = ?').run(discordUser.id).changes;
            return reply(ok(removed ? `${discordUser.username} was unbanned.` : `${discordUser.username} was not banned.`));
        }

        if (group === 'words') {
            if (sub === 'list') {
                return reply(new Card({ title: 'Trigger words', emoji: '📝', color: theme.info })
                    .lines(words.TYPES.map((type) => `**${type}** (${words.get(type).length}): ${words.get(type).map((w) => `\`${w}\``).join(', ') || '*empty*'}`)));
            }
            const type = interaction.options.getString('type', true);
            const word = interaction.options.getString('word', true);
            const changed = sub === 'add' ? words.add(type, word) : words.remove(type, word);
            return reply(ok(changed ? `${sub === 'add' ? 'Added' : 'Removed'} \`${word}\` (${type}).` : 'Nothing changed.'));
        }

        if (sub === 'suggestions') {
            const rows = q("SELECT * FROM suggestions WHERE status = 'open' ORDER BY id DESC LIMIT 15").all();
            return reply(new Card({ title: 'Open suggestions', emoji: '💡', color: theme.info })
                .lines(rows.length ? rows.map((s) => `**#${s.id} ${s.title}** · ${s.username} · ${relative(s.created_at)}\n-# ${(s.body ?? '').slice(0, 150)}`) : ['No suggestions yet.']));
        }

        await loading(interaction, 'Deploying slash commands…', { ephemeral: true });
        const results = await deploy(interaction.options.getString('scope', true), { rest: interaction.client.rest });
        for (const list of Object.values(results)) mentions.remember(list);
        await interaction.editReply(edit(ok(Object.entries(results).map(([where, list]) => `Deployed ${num(list.length)} command(s) → ${where}`).join('\n'))));
    },
};
