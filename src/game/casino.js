const { GameError } = require('../core/errors');
const economy = require('./economy');
const users = require('./users');
const { maxBet } = require('./formulas');
const { parseAmount } = require('./amount');
const { money } = require('./format');
const rng = require('./rng');

const MIN_BET = 50;

/** Validates and takes a bet from the wallet. */
function placeBet(user, input, game) {
    const fresh = users.get(user.id);
    const limit = maxBet(fresh);
    const bet = parseAmount(input, { available: Math.min(fresh.wallet, limit), min: MIN_BET, label: 'bet' });
    if (bet > limit) throw new GameError(`Your max bet is **${money(limit)}**. It grows with your level and prestige.`, { emoji: '🎰' });
    economy.debit(user.id, bet, 'bet', game);
    return bet;
}

/** Pays out `amount` (stake included) and returns the events to track. */
function settle(userId, bet, payout, game) {
    if (payout > 0) economy.credit(userId, payout, 'gamble', game);
    const won = payout > bet;
    const lost = payout < bet;
    return { events: { gamble_wagered: bet, gamble_win: won ? 1 : 0, gamble_loss: lost ? 1 : 0 }, net: payout - bet };
}

// Coinflip: fair coin, 1.95x payout.
const COINFLIP_PAYOUT = 1.95;
function coinflip(choice) {
    const result = rng.chance(0.5) ? 'heads' : 'tails';
    return { result, win: result === choice, multiplier: result === choice ? COINFLIP_PAYOUT : 0 };
}

// Slots: three reels. RTP is ~96% (see test/casino.test.js).
const REEL = [
    ['🍒', 28],
    ['🍋', 24],
    ['🍇', 20],
    ['🔔', 14],
    ['⭐', 8],
    ['💎', 4],
    ['7️⃣', 2],
];
const THREE = { '🍒': 4, '🍋': 6, '🍇': 10, '🔔': 20, '⭐': 50, '💎': 150, '7️⃣': 777 };
const PAIR = 1.25;
const CHERRY_PAIR = 1.4;

function slotsMultiplier(reels) {
    const [a, b, c] = reels;
    if (a === b && b === c) return THREE[a];
    const pair = a === b || a === c ? a : b === c ? b : null;
    if (!pair) return 0;
    return pair === '🍒' ? CHERRY_PAIR : PAIR;
}

function slots() {
    const reels = [0, 1, 2].map(() => rng.weighted(REEL)[0]);
    return { reels, multiplier: slotsMultiplier(reels) };
}

// Roulette: European wheel, single zero.
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const ROULETTE_BETS = {
    red: { name: '🔴 Red', payout: 2, wins: (n) => RED.has(n) },
    black: { name: '⚫ Black', payout: 2, wins: (n) => n !== 0 && !RED.has(n) },
    even: { name: 'Even', payout: 2, wins: (n) => n !== 0 && n % 2 === 0 },
    odd: { name: 'Odd', payout: 2, wins: (n) => n % 2 === 1 },
    low: { name: '1-18', payout: 2, wins: (n) => n >= 1 && n <= 18 },
    high: { name: '19-36', payout: 2, wins: (n) => n >= 19 },
    dozen1: { name: '1st dozen (1-12)', payout: 3, wins: (n) => n >= 1 && n <= 12 },
    dozen2: { name: '2nd dozen (13-24)', payout: 3, wins: (n) => n >= 13 && n <= 24 },
    dozen3: { name: '3rd dozen (25-36)', payout: 3, wins: (n) => n >= 25 },
};

function rouletteColor(n) {
    if (n === 0) return '🟢';
    return RED.has(n) ? '🔴' : '⚫';
}

function roulette(bet, number = null) {
    const pocket = rng.int(0, 36);
    if (bet === 'number') {
        const win = pocket === number;
        return { pocket, color: rouletteColor(pocket), win, multiplier: win ? 36 : 0 };
    }
    const def = ROULETTE_BETS[bet];
    const win = def.wins(pocket);
    return { pocket, color: rouletteColor(pocket), win, multiplier: win ? def.payout : 0 };
}

// Blackjack: infinite deck, dealer stands on 17, blackjack pays 3:2.
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function drawCard() {
    return { rank: rng.pick(RANKS), suit: rng.pick(SUITS) };
}

function handValue(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.rank === 'A') {
            aces += 1;
            total += 11;
        } else {
            total += ['J', 'Q', 'K'].includes(card.rank) ? 10 : Number(card.rank);
        }
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces -= 1;
    }
    return total;
}

const isBlackjack = (hand) => hand.length === 2 && handValue(hand) === 21;

function showHand(hand, hideSecond = false) {
    return hand.map((c, i) => (hideSecond && i === 1 ? '`??`' : `\`${c.rank}${c.suit}\``)).join(' ');
}

class Blackjack {
    constructor(bet) {
        this.bet = bet;
        this.player = [drawCard(), drawCard()];
        this.dealer = [drawCard(), drawCard()];
        this.doubled = false;
        this.done = false;
        this.outcome = null;
        if (isBlackjack(this.player) || isBlackjack(this.dealer)) this.finish();
    }

    hit() {
        this.player.push(drawCard());
        if (handValue(this.player) >= 21) this.stand();
    }

    double() {
        this.bet *= 2;
        this.doubled = true;
        this.player.push(drawCard());
        this.stand();
    }

    stand() {
        if (handValue(this.player) <= 21) {
            while (handValue(this.dealer) < 17) this.dealer.push(drawCard());
        }
        this.finish();
    }

    finish() {
        this.done = true;
        const p = handValue(this.player);
        const d = handValue(this.dealer);
        if (isBlackjack(this.player) && !isBlackjack(this.dealer)) this.outcome = 'blackjack';
        else if (isBlackjack(this.dealer) && !isBlackjack(this.player)) this.outcome = 'lose';
        else if (p > 21) this.outcome = 'bust';
        else if (d > 21 || p > d) this.outcome = 'win';
        else if (p === d) this.outcome = 'push';
        else this.outcome = 'lose';
    }

    /** Total returned to the player, stake included. */
    get payout() {
        return { blackjack: Math.floor(this.bet * 2.5), win: this.bet * 2, push: this.bet, lose: 0, bust: 0 }[this.outcome] ?? 0;
    }
}

module.exports = {
    placeBet, settle, coinflip, slots, slotsMultiplier, roulette, rouletteColor, Blackjack, handValue, showHand,
    REEL, THREE, ROULETTE_BETS, COINFLIP_PAYOUT, MIN_BET,
};
