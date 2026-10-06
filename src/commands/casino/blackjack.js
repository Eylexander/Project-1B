const { SlashCommandBuilder, InteractionContextType, ButtonStyle } = require('discord.js');
const player = require('../../core/player');
const users = require('../../game/users');
const economy = require('../../game/economy');
const casino = require('../../game/casino');
const progress = require('../../game/progress');
const { money } = require('../../game/format');
const { Card, payload, edit, button } = require('../../ui/card');
const { nonce, awaitClick, send } = require('../../ui/interactive');
const theme = require('../../ui/theme');

const TURN_MS = 60_000;
const OUTCOMES = {
    blackjack: { title: 'Blackjack!', color: theme.success, emoji: '🃏' },
    win: { title: 'You win!', color: theme.success, emoji: '🎉' },
    push: { title: 'Push', color: theme.muted, emoji: '🤝' },
    lose: { title: 'Dealer wins', color: theme.danger, emoji: '💀' },
    bust: { title: 'Bust!', color: theme.danger, emoji: '💥' },
};

function table(game, reveal) {
    return [
        `**Dealer** · ${reveal ? casino.handValue(game.dealer) : '?'}`,
        casino.showHand(game.dealer, !reveal),
        '',
        `**You** · ${casino.handValue(game.player)}`,
        casino.showHand(game.player),
    ];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Beat the dealer to 21. Blackjack pays 3:2.')
        .addStringOption((o) => o.setName('bet').setDescription('e.g. 500, 10k, half, all').setRequired(true))
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),

    async execute(interaction) {
        const user = player.self(interaction);
        const bet = casino.placeBet(user, interaction.options.getString('bet', true), 'blackjack');
        const game = new casino.Blackjack(bet);
        const id = nonce();
        let message = null;
        let last = interaction;

        while (!game.done) {
            const canDouble = game.player.length === 2 && users.get(user.id).wallet >= game.bet;
            const card = new Card({ title: 'Blackjack', emoji: '🃏', subtitle: `Bet ${money(game.bet)}`, color: theme.casino })
                .lines(table(game, false))
                .buttons(
                    button(`${id}:hit`, 'Hit', { style: ButtonStyle.Primary, emoji: '➕' }),
                    button(`${id}:stand`, 'Stand', { style: ButtonStyle.Secondary, emoji: '✋' }),
                    button(`${id}:double`, 'Double', { style: ButtonStyle.Success, emoji: '✌️', disabled: !canDouble }),
                );
            if (!message) {
                message = await send(interaction, payload(card));
            } else {
                await last.update(edit(card));
            }

            const click = await awaitClick(message, user.id, { time: TURN_MS, prefix: id });
            if (!click) {
                game.stand(); // walked away: the hand plays out as a stand
                last = null;
                break;
            }
            last = click;
            const action = click.customId.split(':').pop();
            if (action === 'hit') game.hit();
            else if (action === 'stand') game.stand();
            else if (action === 'double' && canDouble) {
                economy.debit(user.id, game.bet, 'bet', 'blackjack double');
                game.double();
            }
        }

        const payout = game.payout;
        const { events, net } = casino.settle(user.id, game.bet, payout, 'blackjack');
        const notices = progress.after(user.id, { xp: 8, events });
        const outcome = OUTCOMES[game.outcome];
        const result = new Card({ title: outcome.title, emoji: outcome.emoji, subtitle: `Bet ${money(game.bet)}${game.doubled ? ' (doubled)' : ''}`, color: outcome.color })
            .lines(table(game, true))
            .divider()
            .text(net > 0 ? `You win **${money(payout)}** (+${money(net)}).` : net === 0 ? 'Your bet is returned.' : `You lose **${money(game.bet)}**.`)
            .footer(`Wallet: ${money(users.get(user.id).wallet)}`)
            .notices(notices);

        if (!message) await interaction.reply(payload(result)); // natural blackjack: the hand ended on the deal
        else if (last) await last.update(edit(result));
        else await interaction.editReply(edit(result));
    },
};
