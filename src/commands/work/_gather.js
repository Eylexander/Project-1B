const { SlashCommandBuilder, InteractionContextType, ButtonStyle, MessageFlags } = require('discord.js');
const player = require('../../core/player');
const users = require('../../game/users');
const inventory = require('../../game/inventory');
const gathering = require('../../game/gathering');
const shop = require('../../game/shop');
const progress = require('../../game/progress');
const { money, itemLabel } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const theme = require('../../ui/theme');

function resultCard(user, result) {
    const { def, finds } = result;
    const total = finds.reduce((sum, f) => sum + f.item.sell * f.quantity, 0);
    const card = new Card({ title: def.name, emoji: def.emoji, color: theme.gather });
    if (finds.length) {
        card.text(`You ${def.verb} and found:`);
        card.lines(finds.map((f) => `${inventory.RARITIES[f.item.rarity].emoji} ${itemLabel(f.item, f.quantity)} · ${money(f.item.sell * f.quantity)}`));
        card.text(`-# Worth ${money(total)} at the shop${result.lucky ? ' · 🍀 lucky' : ''}`);
    } else {
        card.text(result.flavor);
    }
    if (result.broke) card.text(`💥 Your ${result.tool.emoji} **${result.tool.name}** broke!`);

    const after = users.get(user.id);
    const energy = users.energyInfo(after);
    const tool = inventory.bestTool(user.id, result.activity);
    card.footer(`⚡ ${energy.energy}/${energy.max} energy · ${tool ? `${tool.item.emoji} ${tool.durability ?? tool.item.durability}/${tool.item.durability} durability${tool.quantity > 1 ? ` (+${tool.quantity - 1} spare)` : ''}` : 'no tool left'}`);
    return card;
}

/** Shared logic for /fish, /mine and /dig. */
function makeGatherCommand(activity, { name, description, again }) {
    async function run(interaction, fromButton) {
        const user = player.self(interaction);
        const result = gathering.gather(user.id, activity);
        const notices = progress.after(user.id, { xp: Math.round(result.xp), events: result.events });
        const card = resultCard(user, result)
            .notices([...player.welcome(user), ...notices])
            .buttons(
                button(`p1b:gather:${activity}:${user.id}`, again, { style: ButtonStyle.Primary, emoji: result.def.emoji }),
                button(`p1b:sellloot:${user.id}`, 'Sell all loot', { emoji: '🏷️' }),
            );
        if (fromButton) await interaction.update(edit(card));
        else await interaction.reply(payload(card));
    }

    return {
        data: new SlashCommandBuilder()
            .setName(name)
            .setDescription(description)
            .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),
        execute: (interaction) => run(interaction, false),
        run,
    };
}

async function guard(interaction, ownerId) {
    if (interaction.user.id === ownerId) return true;
    await interaction.reply({ content: 'Those are not your buttons. Try the command yourself!', flags: MessageFlags.Ephemeral });
    return false;
}

// Button handlers shared by the three commands (registered once, from fish.js).
const components = {
    async gather(interaction, [activity, ownerId]) {
        if (!(await guard(interaction, ownerId))) return;
        if (!['fish', 'mine', 'dig'].includes(activity)) return;
        await require(`./${activity}.js`).run(interaction, true);
    },
    async sellloot(interaction, [ownerId]) {
        if (!(await guard(interaction, ownerId))) return;
        const user = player.self(interaction);
        const sold = shop.sellGroup(user.id, '@loot');
        const notices = progress.after(user.id, { events: { sell_value: sold.total } });
        await interaction.reply(payload(new Card({ title: 'Sold your loot', emoji: '🏷️', color: theme.success })
            .lines(sold.lines.slice(0, 15).map((l) => `${itemLabel(l.item, l.quantity)} · ${money(l.income)}`))
            .text(sold.lines.length > 15 ? `…and ${sold.lines.length - 15} more` : null)
            .text(`**Total: ${money(sold.total)}**`)
            .notices(notices), { ephemeral: true }));
    },
};

module.exports = { makeGatherCommand, components };
