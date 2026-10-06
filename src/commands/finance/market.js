const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { GameError } = require('../../core/errors');
const player = require('../../core/player');
const inventory = require('../../game/inventory');
const market = require('../../game/market');
const progress = require('../../game/progress');
const { parseAmount } = require('../../game/amount');
const { money, itemLabel, relative, pct } = require('../../game/format');
const { Card, payload } = require('../../ui/card');
const { paginate } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('market')
        .setDescription('The player market: sell your items to other players.')
        .addSubcommand((s) => s.setName('browse').setDescription('See what is for sale.')
            .addStringOption((o) => o.setName('item').setDescription('Only one item').setAutocomplete(true)))
        .addSubcommand((s) => s.setName('sell').setDescription('List items for sale.')
            .addStringOption((o) => o.setName('item').setDescription('What to sell').setRequired(true).setAutocomplete(true))
            .addStringOption((o) => o.setName('quantity').setDescription('How many (e.g. 10, all)').setRequired(true))
            .addStringOption((o) => o.setName('price').setDescription('Price for ONE item (e.g. 250, 1.5k)').setRequired(true)))
        .addSubcommand((s) => s.setName('buy').setDescription('Buy a listing.')
            .addIntegerOption((o) => o.setName('listing').setDescription('Listing number (#id)').setRequired(true).setMinValue(1))
            .addIntegerOption((o) => o.setName('quantity').setDescription('How many (default: all of it)').setMinValue(1)))
        .addSubcommand((s) => s.setName('cancel').setDescription('Take down one of your listings.')
            .addIntegerOption((o) => o.setName('listing').setDescription('Listing number (#id)').setRequired(true).setMinValue(1)))
        .addSubcommand((s) => s.setName('mine').setDescription('Your active listings.'))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async autocomplete(interaction) {
        const sub = interaction.options.getSubcommand();
        const focused = interaction.options.getFocused();
        if (sub === 'sell') {
            const owned = new Map(inventory.list(interaction.user.id).map((r) => [r.item_id, r.quantity]));
            return interaction.respond(inventory.choices(focused, (i) => owned.has(i.id) && i.id !== 'trophy_1b')
                .map((c) => ({ ...c, name: `${c.name} ×${owned.get(c.value)}` })));
        }
        await interaction.respond(inventory.choices(focused));
    },

    async execute(interaction) {
        const user = player.self(interaction);
        const sub = interaction.options.getSubcommand();

        if (sub === 'browse' || sub === 'mine') {
            const itemQuery = sub === 'browse' ? interaction.options.getString('item') : null;
            const item = itemQuery ? inventory.requireItem(itemQuery) : null;
            const filter = { itemId: item?.id ?? null, sellerId: sub === 'mine' ? user.id : null };
            const { total } = market.browse({ ...filter, limit: 1 });
            const pages = Math.max(1, Math.ceil(total / PER_PAGE));
            return paginate(interaction, (page) => {
                const { rows } = market.browse({ ...filter, limit: PER_PAGE, offset: page * PER_PAGE });
                const card = new Card({
                    title: sub === 'mine' ? 'Your listings' : item ? `Market: ${item.name}` : 'Player market',
                    emoji: '🏪',
                    subtitle: `${total} listing${total === 1 ? '' : 's'}${sub === 'mine' ? ` · max ${market.MAX_LISTINGS}` : ' · cheapest first'}`,
                    color: theme.finance,
                });
                if (!rows.length) return card.text(sub === 'mine' ? 'You are not selling anything. Use `/market sell`.' : 'Nothing for sale right now.');
                card.lines(rows.map((r) => `${market.describeListing(r)} · ends ${relative(r.expires_at)}${item ? ` · shop pays ${money(item.sell)}` : ''}`));
                return card.footer('Buy with /market buy listing:<#>');
            }, { pages, ephemeral: sub === 'mine' });
        }

        if (sub === 'sell') {
            const item = inventory.requireItem(interaction.options.getString('item', true));
            const have = inventory.count(user.id, item.id);
            if (!have) throw new GameError(`You don't have any ${itemLabel(item)}.`);
            const quantity = parseAmount(interaction.options.getString('quantity', true), { available: have, label: 'quantity' });
            const price = parseAmount(interaction.options.getString('price', true), { label: 'price' });
            const listing = market.create(user.id, item.id, quantity, price);
            return interaction.reply(payload(new Card({ title: 'Listed!', emoji: '🏷️', color: theme.success })
                .lines([
                    `\`#${listing.id}\` ${itemLabel(item, quantity)} at **${money(price)}** each.`,
                    `Listing fee paid: ${money(listing.fee)} · ${pct(market.SALE_TAX, { sign: false, digits: 0 })} tax is taken when it sells.`,
                    item.sell && price < item.sell ? `⚠️ The shop would pay you ${money(item.sell)} each. Are you sure?` : null,
                ])
                .footer('Unsold items come back to you after 7 days.')));
        }

        if (sub === 'buy') {
            const result = market.buy(user.id, interaction.options.getInteger('listing', true), interaction.options.getInteger('quantity'));
            const notices = progress.after(user.id, { xp: 10 });
            return interaction.reply(payload(new Card({ title: 'Bought from the market', emoji: '🛍️', color: theme.success })
                .text(`You bought ${itemLabel(result.listing.item, result.quantity)} from **${result.listing.seller_name}** for **${money(result.cost)}**.`)
                .notices(notices), { ping: [] }));
        }

        if (sub === 'cancel') {
            const listing = market.cancel(user.id, interaction.options.getInteger('listing', true));
            return interaction.reply(payload(new Card({ title: 'Listing cancelled', emoji: '↩️', color: theme.muted })
                .text(`${itemLabel(listing.item, listing.quantity)} went back into your backpack. (The listing fee is not refunded.)`)));
        }
    },
};
