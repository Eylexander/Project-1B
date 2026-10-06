const { ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const { Card, payload, edit, button, errorCard } = require('./card');
const { GameError } = require('../core/errors');
const theme = require('./theme');

// Short-lived button flows (pagination, confirmations, mini-games) use collectors.
// Their custom ids start with "x:" so the global router knows to leave them alone.

let counter = 0;
function nonce() {
    counter = (counter + 1) % 46656;
    return `x:${Date.now().toString(36)}${counter.toString(36)}`;
}

/** Sends the first response (or edits it if deferred) and returns the Message. */
async function send(interaction, options) {
    if (interaction.deferred || interaction.replied) return interaction.editReply(options);
    const response = await interaction.reply({ ...options, withResponse: true });
    return response?.resource?.message ?? interaction.fetchReply();
}

function notYours(i) {
    i.reply({ content: "That's not yours to click. Run the command yourself!", flags: MessageFlags.Ephemeral }).catch(() => {});
}

/** Resolves with the next button press from `userId` on `message`, or null after `time` ms. */
async function awaitClick(message, userId, { time = 30_000, prefix = null } = {}) {
    try {
        return await message.awaitMessageComponent({
            time,
            filter: (i) => {
                if (prefix && !i.customId.startsWith(prefix)) return false;
                if (i.user.id !== userId) {
                    notYours(i);
                    return false;
                }
                return true;
            },
        });
    } catch {
        return null;
    }
}

/**
 * Pages through content with ◀ ▶ buttons.
 * `render(page)` returns a Card (without navigation) for that page.
 */
async function paginate(interaction, render, { pages, start = 0, ephemeral = false, time = 120_000 } = {}) {
    const id = nonce();
    let page = Math.min(Math.max(0, start), Math.max(0, pages - 1));
    const build = (withNav) => {
        const card = render(page);
        if (withNav && pages > 1) {
            card.buttons(
                button(`${id}:first`, null, { emoji: '⏮️', disabled: page === 0 }),
                button(`${id}:prev`, null, { emoji: '◀️', disabled: page === 0 }),
                button(`${id}:page`, `${page + 1} / ${pages}`, { disabled: true }),
                button(`${id}:next`, null, { emoji: '▶️', disabled: page >= pages - 1 }),
                button(`${id}:last`, null, { emoji: '⏭️', disabled: page >= pages - 1 }),
            );
        }
        return card;
    };

    const message = await send(interaction, payload(build(true), { ephemeral }));
    if (pages <= 1) return;

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time,
        filter: (i) => i.customId.startsWith(id),
    });
    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) return notYours(i);
        const action = i.customId.split(':').pop();
        page = { first: 0, prev: page - 1, next: page + 1, last: pages - 1 }[action] ?? page;
        page = Math.min(Math.max(0, page), pages - 1);
        await i.update(edit(build(true))).catch(() => {});
    });
    collector.on('end', () => {
        interaction.editReply(edit(build(false))).catch(() => {});
    });
}

/**
 * Asks the player to confirm. Returns { ok, click } where click is the button
 * interaction to update with the result (null on timeout).
 */
async function confirm(interaction, card, { yes = 'Confirm', no = 'Cancel', danger = false, ephemeral = false, time = 30_000 } = {}) {
    const id = nonce();
    card.buttons(
        button(`${id}:yes`, yes, { style: danger ? ButtonStyle.Danger : ButtonStyle.Success, emoji: '✔️' }),
        button(`${id}:no`, no, { emoji: '✖️' }),
    );
    const message = await send(interaction, payload(card, { ephemeral }));
    const click = await awaitClick(message, interaction.user.id, { time, prefix: id });
    if (!click) {
        await interaction.editReply(edit(new Card({ title: 'Timed out', emoji: '⌛', color: theme.muted }).text('Nothing happened.'))).catch(() => {});
        return { ok: false, click: null };
    }
    if (click.customId.endsWith(':no')) {
        await click.update(edit(new Card({ title: 'Cancelled', emoji: '✖️', color: theme.muted }).text('Nothing happened.'))).catch(() => {});
        return { ok: false, click: null };
    }
    return { ok: true, click };
}

/**
 * Runs the confirmed action and shows its result on the clicked message.
 * A GameError (e.g. the player spent the money meanwhile) is shown in place instead of failing the click.
 */
async function finish(click, action) {
    let card;
    try {
        card = await action();
    } catch (error) {
        if (!(error instanceof GameError)) throw error;
        card = errorCard(error.title, error.message, error.emoji);
    }
    await click.update(edit(card));
}

/** Replies right away with a loading card, for commands that wait on an outside API. */
async function loading(interaction, text, { ephemeral = false } = {}) {
    await interaction.reply(payload(new Card({ color: theme.muted }).text(`⏳ ${text}`), { ephemeral }));
    interaction.p1bLoading = true;
}

module.exports = { nonce, send, awaitClick, paginate, confirm, finish, loading, notYours };
