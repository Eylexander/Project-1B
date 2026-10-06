const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { freshDb, fixRandom, fakeUser } = require('./helpers');

const { q } = require('../src/db');
const F = require('../src/game/formulas');
const users = require('../src/game/users');
const economy = require('../src/game/economy');
const inventory = require('../src/game/inventory');
const gathering = require('../src/game/gathering');
const shop = require('../src/game/shop');
const jobs = require('../src/game/jobs');
const leveling = require('../src/game/leveling');
const businesses = require('../src/game/businesses');
const stocks = require('../src/game/stocks');
const market = require('../src/game/market');
const lottery = require('../src/game/lottery');
const casino = require('../src/game/casino');
const crime = require('../src/game/crime');
const quests = require('../src/game/quests');
const progress = require('../src/game/progress');
const achievements = require('../src/game/achievements');
const prestige = require('../src/game/prestige');
const drops = require('../src/game/drops');
const networth = require('../src/game/networth');
const cooldowns = require('../src/game/cooldowns');
const { parseAmount } = require('../src/game/amount');
const { GameError } = require('../src/core/errors');

function player(name = 'P', setup = {}) {
    const user = users.ensure(fakeUser(name));
    const sets = Object.entries(setup);
    if (sets.length) q(`UPDATE users SET ${sets.map(([k]) => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...setup, id: user.id });
    return users.get(user.id);
}

beforeEach(() => freshDb());

describe('formatting', () => {
    it('formats money, compact numbers and cents', () => {
        const { money, compact, cents, duration } = require('../src/game/format');
        assert.equal(money(1234567), '$1,234,567');
        assert.equal(money(-50), '-$50');
        assert.equal(compact(20_544_794), '$20.5M');
        assert.equal(compact(1_000_000_000), '$1B');
        assert.equal(cents(1299.6), '$13.00');
        assert.equal(cents(1234.4), '$12.34');
        assert.equal(cents(5.2), '$0.05');
        assert.equal(duration(90_000), '1m 30s');
    });
});

describe('amounts', () => {
    it('parses numbers, suffixes and keywords', () => {
        assert.equal(parseAmount('1500'), 1500);
        assert.equal(parseAmount('1,500'), 1500);
        assert.equal(parseAmount('2.5k'), 2500);
        assert.equal(parseAmount('3M'), 3_000_000);
        assert.equal(parseAmount('1b'), 1_000_000_000);
        assert.equal(parseAmount('all', { available: 777 }), 777);
        assert.equal(parseAmount('half', { available: 777 }), 388);
        assert.equal(parseAmount('25%', { available: 1000 }), 250);
    });
    it('rejects garbage and zero', () => {
        assert.throws(() => parseAmount('banana'), GameError);
        assert.throws(() => parseAmount('0'), GameError);
        assert.throws(() => parseAmount('all', { available: 0 }), GameError);
        assert.throws(() => parseAmount('-5'), GameError);
    });
});

describe('accounts and money', () => {
    it('creates new players with a starter wallet and a ledger entry', () => {
        const user = users.ensure(fakeUser('Newbie'));
        assert.equal(user.isNew, true);
        assert.equal(user.wallet, users.STARTING_WALLET);
        assert.equal(q('SELECT COUNT(*) AS c FROM transactions WHERE user_id = ?').get(user.id).c, 1);
    });
    it('never lets a balance go negative', () => {
        const user = player('A');
        assert.throws(() => economy.debit(user.id, 501, 'test'), GameError);
        assert.equal(users.get(user.id).wallet, 500);
        economy.debit(user.id, 500, 'test');
        assert.equal(users.get(user.id).wallet, 0);
    });
    it('counts only income towards lifetime earnings', () => {
        const user = player('A');
        economy.credit(user.id, 100, 'work');
        economy.credit(user.id, 50, 'deposit');
        assert.equal(users.get(user.id).lifetime_earned, 100);
    });
    it('pays bank interest by the hour, only on the insured part', () => {
        const now = Date.now();
        const user = player('A', { bank: 10_000, interest_at: now - 24 * F.HOUR - 1000 });
        const after = users.accrueInterest(user, now);
        assert.equal(after.bank, 10_000 + Math.floor(10_000 * F.BANK_INTEREST_DAILY));
        const rich = player('B', { bank: 10_000_000, interest_at: now - 24 * F.HOUR });
        const capped = users.accrueInterest(rich, now);
        assert.equal(capped.bank - 10_000_000, Math.floor(F.bankCapacity(rich) * F.BANK_INTEREST_DAILY));
    });
});

describe('energy', () => {
    it('regenerates over time and caps at max', () => {
        const now = Date.now();
        const user = player('A', { energy: 10, energy_at: now - 5 * F.ENERGY_REGEN_MS - 100 });
        assert.equal(users.energyInfo(user, now).energy, 15);
        const full = player('B', { energy: 10, energy_at: now - 1000 * F.ENERGY_REGEN_MS });
        assert.equal(users.energyInfo(full, now).energy, F.maxEnergy(1));
    });
    it('spends energy without losing partial regeneration', () => {
        const now = Date.now();
        const user = player('A', { energy: 50, energy_at: now - 2.5 * F.ENERGY_REGEN_MS });
        assert.equal(users.spendEnergy(user.id, 10, now), true);
        const info = users.energyInfo(users.get(user.id), now);
        assert.equal(info.energy, 42);
        assert.equal(users.spendEnergy(user.id, 100, now), false);
    });
    it('lets consumables overflow up to twice the max', () => {
        const user = player('A');
        users.addEnergy(user.id, 1000);
        assert.equal(users.energyInfo(users.get(user.id)).energy, F.maxEnergy(1) * 2);
    });
});

describe('levels', () => {
    it('levels up, pays the reward and carries extra XP', () => {
        const user = player('A');
        const need = F.xpForNext(1) + F.xpForNext(2) + 10;
        const result = leveling.addXp(user.id, need);
        const after = users.get(user.id);
        assert.deepEqual(result.levels, [2, 3]);
        assert.equal(after.level, 3);
        assert.equal(after.xp, 10);
        assert.equal(after.wallet, 500 + F.levelUpReward(2) + F.levelUpReward(3));
        assert.ok(result.notices.some((n) => n.includes('Level 3')));
    });
});

describe('jobs', () => {
    it('refuses jobs above your level and accepts ones you qualify for', () => {
        const user = player('A');
        assert.throws(() => jobs.join(user, 'ingenieur'), GameError);
        jobs.join(user, 'barista');
        assert.equal(users.get(user.id).job_id, 'barista');
    });
    it('requires a laptop for the hacker job', () => {
        const user = player('A', { level: 35 });
        assert.match(jobs.blocker(user, jobs.JOBS.hacker), /Laptop/);
        inventory.add(user.id, 'laptop');
        assert.equal(jobs.blocker(user, jobs.JOBS.hacker), null);
    });
    it('promotes automatically once shifts and level are reached', () => {
        const user = player('A', { level: 5, job_id: 'barista', job_shifts: 19 });
        const result = jobs.completeShifts(user.id, 1, 'ok');
        assert.equal(result.promotedTo.title, 'Barista');
        assert.equal(users.get(user.id).job_tier, 1);
        assert.ok(result.pay > 0);
    });
    it('pays more for a great shift than for slacking', () => {
        const restore = fixRandom([0.5]);
        try {
            const a = player('A', { job_id: 'barista' });
            const great = jobs.completeShifts(a.id, 1, 'great').pay;
            const slack = jobs.completeShifts(a.id, 1, 'slacked').pay;
            assert.ok(great > slack * 2);
        } finally {
            restore();
        }
    });
});

describe('gathering and items', () => {
    it('needs the right tool', () => {
        const user = player('A');
        assert.throws(() => gathering.gather(user.id, 'fish'), /Fishing Rod/);
    });
    it('finds loot, costs energy, wears the tool and respects the cooldown', () => {
        const user = player('A');
        inventory.add(user.id, 'fishing_rod');
        const result = gathering.gather(user.id, 'fish');
        assert.equal(users.energyInfo(users.get(user.id)).energy, F.maxEnergy(1) - 5);
        assert.equal(q('SELECT durability FROM inventory WHERE user_id = ? AND item_id = ?').get(user.id, 'fishing_rod').durability, 39);
        assert.ok(result.events.energy_spent === 5);
        assert.throws(() => gathering.gather(user.id, 'fish'), /again/);
    });
    it('breaks tools when durability runs out and moves to the spare', () => {
        const user = player('A');
        inventory.add(user.id, 'pickaxe', 2);
        q('UPDATE inventory SET durability = 1 WHERE user_id = ?').run(user.id);
        assert.equal(inventory.wearTool(user.id, 'pickaxe'), true);
        const row = q('SELECT quantity, durability FROM inventory WHERE user_id = ?').get(user.id);
        assert.deepEqual({ ...row }, { quantity: 1, durability: 40 });
        q('UPDATE inventory SET durability = 1 WHERE user_id = ?').run(user.id);
        inventory.wearTool(user.id, 'pickaxe');
        assert.equal(inventory.count(user.id, 'pickaxe'), 0);
    });
    it('buys and sells at the listed prices', () => {
        const user = player('A', { wallet: 10_000 });
        shop.buy(user.id, 'coffee', 3);
        assert.equal(users.get(user.id).wallet, 10_000 - 450);
        inventory.add(user.id, 'sardine', 10);
        inventory.add(user.id, 'stone', 5);
        const sold = shop.sellGroup(user.id, '@loot');
        assert.equal(sold.total, 10 * 14 + 5 * 4);
        assert.equal(inventory.count(user.id, 'coffee'), 3, 'coffee is not loot');
    });
    it('uses consumables: energy, boosts, bank notes, maps and chests', () => {
        const user = player('A', { energy: 0, energy_at: Date.now() });
        inventory.add(user.id, 'energy_drink');
        shop.use(user.id, 'energy_drink');
        assert.equal(users.energyInfo(users.get(user.id)).energy, 40);
        inventory.add(user.id, 'bank_note');
        shop.use(user.id, 'bank_note');
        assert.ok(users.get(user.id).bank_bonus > 0);
        inventory.add(user.id, 'treasure_map');
        shop.use(user.id, 'treasure_map');
        assert.equal(inventory.count(user.id, 'rare_chest') + inventory.count(user.id, 'legendary_chest'), 1);
        inventory.add(user.id, 'common_chest');
        const before = users.get(user.id).wallet;
        const { opened } = shop.use(user.id, 'common_chest');
        assert.ok(opened.coins >= 400 && users.get(user.id).wallet === before + opened.coins);
        assert.throws(() => shop.use(user.id, 'padlock'), GameError);
    });
    it('crafts when ingredients are there and explains what is missing otherwise', () => {
        const user = player('A');
        inventory.add(user.id, 'iron_ore', 3);
        assert.throws(() => shop.craft(user.id, shop.RECIPES.iron_bar, 1, 1), /Coal/);
        inventory.add(user.id, 'coal', 1);
        shop.craft(user.id, shop.RECIPES.iron_bar, 1, 1);
        assert.equal(inventory.count(user.id, 'iron_bar'), 1);
        assert.equal(inventory.count(user.id, 'iron_ore'), 0);
        assert.equal(shop.recipeFor('iron bar').id, 'iron_bar');
    });
    it('finds items by fuzzy name, accents included', () => {
        assert.equal(inventory.findItem('fishing rod').id, 'fishing_rod');
        assert.equal(inventory.findItem('rick').id, 'lost_vinyl');
        assert.equal(inventory.findItem('nope-nope'), null);
    });
    it('every loot table and recipe only references real items', () => {
        const { GATHERING, CHESTS, DROPS } = require('../src/data/loot');
        const ids = [
            ...Object.values(GATHERING).flatMap((g) => g.table.map((e) => e[0]).filter(Boolean)),
            ...Object.values(CHESTS).flatMap((c) => c.table.map((e) => e[0])),
            ...DROPS.map((d) => d[0]),
            ...Object.values(shop.RECIPES).flatMap((r) => [r.output[0], ...Object.keys(r.inputs)]),
        ];
        for (const id of ids) assert.ok(inventory.ITEMS[id], `unknown item ${id}`);
    });
});

describe('businesses', () => {
    it('earns over time, caps storage, collects and upgrades', () => {
        const user = player('A', { wallet: 100_000 });
        const start = Date.now() - 3 * F.HOUR;
        businesses.buy(user, 'lemonade', start);
        const owned = businesses.owned(user.id);
        assert.equal(owned[0].pending, 3 * 120);
        const late = businesses.owned(user.id, start + 100 * F.HOUR)[0];
        assert.equal(late.pending, businesses.STORAGE_HOURS * 120);
        const { total } = businesses.collect(user.id);
        assert.equal(total, 360);
        const up = businesses.upgrade(user.id, 'lemonade');
        assert.equal(up.level, 2);
        assert.equal(up.perHour, Math.floor(120 * 1.6));
        assert.throws(() => businesses.buy(user, 'lemonade'), /already own/);
        assert.throws(() => businesses.buy(user, 'space_agency'), /level/);
    });
});

describe('stocks', () => {
    it('stays positive and sane over a simulated month', () => {
        let now = Date.now();
        for (let i = 0; i < 30 * 288; i += 1) {
            now += stocks.TICK_MS;
            stocks.tick(now);
        }
        for (const stock of stocks.all()) {
            const start = stocks.STOCKS[stock.symbol].price * 100;
            assert.ok(stock.price >= 1, `${stock.symbol} went to zero`);
            assert.ok(stock.price < start * 20 && stock.price > start / 20, `${stock.symbol} drifted to ${stock.price} from ${start}`);
        }
        assert.ok(q('SELECT COUNT(*) AS c FROM stock_history').get().c <= 3 * 288 * 10 + 10);
    });
    it('buys and sells with fees and tracks the cost basis', () => {
        const user = player('A', { wallet: 1_000_000 });
        const stock = stocks.find('PTAT');
        const bought = stocks.buy(user.id, 'PTAT', 100);
        assert.equal(bought.total, Math.ceil((stock.price * 100) / 100) + bought.fee);
        assert.equal(stocks.holding(user.id, 'PTAT').shares, 100);
        assert.ok(networth.breakdown(user.id).stocks > 0);
        const sold = stocks.sell(user.id, 'ptat', 40);
        assert.equal(stocks.holding(user.id, 'PTAT').shares, 60);
        assert.ok(sold.profit <= 0, 'selling right away loses the fees');
        assert.throws(() => stocks.sell(user.id, 'PTAT', 1000), GameError);
        assert.throws(() => stocks.find('ZZZZ'), GameError);
    });
});

describe('player market', () => {
    it('lists, sells with tax, and returns expired listings', () => {
        const seller = player('Seller');
        const buyer = player('Buyer', { wallet: 10_000 });
        inventory.add(seller.id, 'diamond', 3);
        const listing = market.create(seller.id, 'diamond', 3, 2_000);
        assert.equal(inventory.count(seller.id, 'diamond'), 0);
        assert.throws(() => market.buy(seller.id, listing.id, 1), /own listing/);
        const result = market.buy(buyer.id, listing.id, 2);
        assert.equal(inventory.count(buyer.id, 'diamond'), 2);
        assert.equal(users.get(buyer.id).wallet, 10_000 - 4_000);
        assert.equal(users.get(seller.id).wallet, 500 - listing.fee + 4_000 - result.tax);
        market.expire(Date.now() + market.DURATION + 1);
        assert.equal(inventory.count(seller.id, 'diamond'), 1);
        assert.equal(market.browse().total, 0);
    });
    it('refuses untradable items', () => {
        const user = player('A');
        inventory.add(user.id, 'trophy_1b');
        assert.throws(() => market.create(user.id, 'trophy_1b', 1, 100), GameError);
    });
});

describe('lottery', () => {
    it('sells tickets, draws a winner and opens the next draw', () => {
        const a = player('A', { wallet: 50_000 });
        const b = player('B', { wallet: 50_000 });
        lottery.buy(a.id, 10);
        lottery.buy(b.id, 30);
        const draw = lottery.current();
        assert.equal(draw.tickets, 40);
        assert.throws(() => lottery.buy(a.id, lottery.MAX_TICKETS), /at most/);
        const result = lottery.drawIfDue(Date.now(), true);
        assert.ok([a.id, b.id].includes(result.winner));
        assert.equal(users.get(result.winner).wallet, 50_000 - (result.winner === a.id ? 10_000 : 30_000) + draw.pot);
        assert.notEqual(lottery.current().id, draw.id);
        assert.equal(lottery.drawIfDue(Date.now()), null, 'next draw is not due yet');
    });
});

describe('casino', () => {
    it('slots return about 96% over the long run (exact expectation)', () => {
        const total = casino.REEL.reduce((s, [, w]) => s + w, 0);
        let expected = 0;
        for (const [a, wa] of casino.REEL) for (const [b, wb] of casino.REEL) for (const [c, wc] of casino.REEL) {
            expected += ((wa * wb * wc) / total ** 3) * casino.slotsMultiplier([a, b, c]);
        }
        assert.ok(expected > 0.93 && expected < 0.99, `RTP ${expected}`);
    });
    it('scores blackjack hands with soft aces', () => {
        const hand = (...ranks) => ranks.map((rank) => ({ rank, suit: '♠' }));
        assert.equal(casino.handValue(hand('A', 'K')), 21);
        assert.equal(casino.handValue(hand('A', 'A', '9')), 21);
        assert.equal(casino.handValue(hand('K', 'Q', '5')), 25);
    });
    it('pays roulette correctly', () => {
        const restore = fixRandom([0]); // pocket 0
        try {
            assert.equal(casino.roulette('red').win, false);
            assert.equal(casino.roulette('number', 0).multiplier, 36);
        } finally {
            restore();
        }
    });
    it('limits bets by level', () => {
        const user = player('A', { wallet: 1_000_000 });
        assert.throws(() => casino.placeBet(user, '1m', 'test'), /max bet/);
        assert.equal(casino.placeBet(user, '5k', 'test'), 5_000);
        assert.throws(() => casino.placeBet(user, '10', 'test'), GameError);
    });
});

describe('crime', () => {
    it('robs successfully when the dice say so', () => {
        const robber = player('Robber', { wallet: 10_000 });
        const victim = player('Victim', { wallet: 20_000 });
        const restore = fixRandom([0.01, 0.5]);
        try {
            const result = crime.rob(robber.id, victim.id);
            assert.equal(result.outcome, 'success');
            assert.equal(users.get(robber.id).wallet, 10_000 + result.amount);
            assert.equal(users.get(victim.id).wallet, 20_000 - result.amount);
            assert.throws(() => crime.rob(robber.id, victim.id), GameError, 'cooldown');
        } finally {
            restore();
        }
    });
    it('fines the robber when caught', () => {
        const robber = player('Robber', { wallet: 10_000 });
        const victim = player('Victim', { wallet: 20_000 });
        const restore = fixRandom([0.99, 0.5]);
        try {
            const result = crime.rob(robber.id, victim.id);
            assert.equal(result.outcome, 'caught');
            assert.equal(users.get(victim.id).wallet, 20_000 + result.amount);
        } finally {
            restore();
        }
    });
    it('padlocks stop robbers without lockpicks; passive players are off limits', () => {
        const robber = player('Robber', { wallet: 10_000 });
        const victim = player('Victim', { wallet: 20_000 });
        inventory.add(victim.id, 'padlock');
        assert.equal(crime.rob(robber.id, victim.id).outcome, 'padlock');
        assert.equal(inventory.count(victim.id, 'padlock'), 0);
        const calm = player('Calm', { wallet: 20_000, passive: 1 });
        cooldowns.clear(robber.id, 'rob');
        assert.throws(() => crime.rob(robber.id, calm.id), /passive/);
    });
    it('resolves heists for the whole crew', () => {
        const crew = [player('A', { wallet: 0 }), player('B', { wallet: 0 })];
        const restore = fixRandom([0.01, 0.5]);
        try {
            const result = crime.resolveHeist(crew.map((u) => u.id));
            assert.equal(result.success, true);
            for (const member of crew) assert.equal(users.get(member.id).wallet, result.share + crime.HEIST.entry);
        } finally {
            restore();
        }
    });
});

describe('quests and achievements', () => {
    it('rolls three quests, advances them and pays out', () => {
        const user = player('A');
        const rows = quests.forToday(user.id);
        assert.equal(rows.length, 3);
        assert.equal(new Set(rows.map((r) => r.quest_id)).size, 3);
        const { QUESTS } = require('../src/data/quests');
        const first = rows[0];
        const notices = progress.after(user.id, { events: { [QUESTS[first.quest_id].event]: first.target } });
        assert.ok(notices.some((n) => n.includes('Quest complete')), notices.join('\n'));
        assert.ok(q('SELECT completed_at FROM quests WHERE user_id = ? AND slot = 0').get(user.id).completed_at);
    });
    it('gives a chest when all three quests are done', () => {
        const user = player('A');
        const { QUESTS } = require('../src/data/quests');
        for (const row of quests.forToday(user.id)) progress.after(user.id, { events: { [QUESTS[row.quest_id].event]: row.target } });
        assert.equal(inventory.count(user.id, 'rare_chest'), 1);
    });
    it('unlocks achievements from stats, level and net worth', () => {
        const user = player('A');
        const notices = progress.after(user.id, { events: { work: 1 } });
        assert.ok(notices.some((n) => n.includes('First Paycheck')));
        assert.ok(achievements.has(user.id, 'first_shift'));
        economy.credit(user.id, 2_000_000, 'admin', null, 'bank');
        progress.after(user.id, {});
        assert.ok(achievements.has(user.id, 'millionaire'));
        assert.equal(progress.after(user.id, { events: { work: 1 } }).filter((n) => n.includes('First Paycheck')).length, 0, 'only once');
    });
});

describe('prestige', () => {
    it('needs a billion, then resets money but keeps level and collectibles', () => {
        const user = player('A', { level: 42 });
        assert.throws(() => prestige.prestige(user), /net worth/);
        q('UPDATE users SET bank = ? WHERE id = ?').run(F.BILLION, user.id);
        inventory.add(user.id, 'diamond', 5);
        const info = prestige.prestige(users.get(user.id));
        const after = users.get(user.id);
        assert.equal(after.prestige, 1);
        assert.equal(after.level, 42);
        assert.equal(after.bank, 0);
        assert.equal(after.wallet, info.startingCash);
        assert.equal(inventory.count(user.id, 'diamond'), 0);
        assert.equal(inventory.count(user.id, 'trophy_1b'), 1);
        assert.ok(progress.after(user.id, {}).some((n) => n.includes('Born Again')));
    });
});

describe('treasure drops', () => {
    it('can only be claimed once', () => {
        const a = player('A');
        const b = player('B');
        const drop = drops.spawn('g1', 'c1');
        assert.equal(drops.claim(drop.id, a.id).ok, true);
        const second = drops.claim(drop.id, b.id);
        assert.equal(second.ok, false);
        assert.equal(second.reason, 'taken');
        assert.equal(inventory.count(a.id, drop.chest), 1);
    });
    it('expires', () => {
        const a = player('A');
        const drop = drops.spawn('g1', 'c1');
        assert.equal(drops.claim(drop.id, a.id, Date.now() + drops.LIFETIME_MS + 1).reason, 'expired');
    });
});

describe('leaderboards', () => {
    it('ranks by net worth and can be limited to a server', () => {
        const a = player('A', { bank: 5_000 });
        const b = player('B', { bank: 50_000 });
        const c = player('C', { bank: 500_000 });
        assert.deepEqual(networth.ranking('networth', { limit: 3 }).map((r) => r.id), [c.id, b.id, a.id]);
        assert.deepEqual(networth.ranking('networth', { ids: [a.id, b.id] }).map((r) => r.id), [b.id, a.id]);
        assert.equal(networth.rankOf(a.id), 3);
        assert.equal(networth.count([a.id]), 1);
    });
});

describe('journey', () => {
    it('snapshots net worth daily and measures the pace to 1B', () => {
        const journey = require('../src/game/journey');
        const user = player('A', { bank: 1_000_000 });
        const now = Date.now();
        journey.snapshot(now - 6 * F.DAY);
        q('UPDATE users SET bank = ? WHERE id = ?').run(7_000_000, user.id);
        journey.snapshot(now);
        assert.equal(journey.history(user.id).length, 2);
        const pace = journey.pace(user.id, 7_000_000, now);
        assert.ok(pace.perDay > 900_000 && pace.perDay <= 1_000_500, `perDay ${pace.perDay}`);
        assert.ok(pace.etaDays > 900 && pace.etaDays < 1100);
        journey.snapshot(now - 7 * F.DAY);
        q('UPDATE networth_history SET networth = 500 WHERE day = ?').run(journey.dayKey(now - 7 * F.DAY));
        const climbers = journey.climbers({ now });
        assert.equal(climbers[0].user_id, user.id);
        assert.equal(climbers[0].gain, 7_000_500 - 500);
    });
});
