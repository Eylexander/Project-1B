const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const { freshDb, fixRandom, fakeUser, textOf, buttonsOf } = require('./helpers');
const { Harness } = require('./harness');

const { q } = require('../src/db');
const config = require('../src/config');
const registry = require('../src/core/registry');
const users = require('../src/game/users');
const inventory = require('../src/game/inventory');
const economy = require('../src/game/economy');
const cooldowns = require('../src/game/cooldowns');
const guilds = require('../src/game/guilds');
const F = require('../src/game/formulas');

registry.load();

let h;
beforeEach(() => {
    freshDb();
    h = new Harness();
});

function me() {
    return users.get(h.user.id);
}

function give(userId, setup) {
    const sets = Object.entries(setup);
    q(`UPDATE users SET ${sets.map(([k]) => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...setup, id: userId });
}

function assertClean() {
    assert.deepEqual(h.problems, [], `Discord would reject a payload:\n${h.problems.join('\n')}`);
    const crashes = h.records.filter((r) => textOf(r.options).includes('Something broke'));
    assert.equal(crashes.length, 0, `A command crashed:\n${crashes.map((c) => textOf(c.options)).join('\n')}`);
}

const originalGet = axios.get;
after(() => {
    axios.get = originalGet;
});

describe('command definitions', () => {
    it('are valid for Discord', () => {
        const { public: pub, owner } = registry.definitions();
        const all = [...pub, ...owner];
        assert.ok(all.length <= 100, 'Discord allows 100 global commands');
        const size = (o) => (o.name?.length ?? 0) + (o.description?.length ?? 0)
            + (o.choices ?? []).reduce((s, c) => s + c.name.length + String(c.value).length, 0)
            + (o.options ?? []).reduce((s, x) => s + size(x), 0);
        for (const cmd of all) {
            assert.match(cmd.name, /^[-_a-z0-9]{1,32}$/);
            assert.ok(cmd.description.length >= 1 && cmd.description.length <= 100, `${cmd.name} description length`);
            assert.ok(size(cmd) <= 4000, `${cmd.name} is ${size(cmd)} characters (max 4000)`);
            const walk = (options, where) => {
                assert.ok((options ?? []).length <= 25, `${where} has too many options`);
                let optionalSeen = false;
                for (const o of options ?? []) {
                    assert.ok(o.description.length <= 100, `${where}.${o.name} description too long`);
                    assert.ok((o.choices ?? []).length <= 25, `${where}.${o.name} has too many choices`);
                    for (const c of o.choices ?? []) assert.ok(c.name.length <= 100, `${where}.${o.name} choice too long: ${c.name}`);
                    if (o.type === 1 || o.type === 2) walk(o.options, `${where} ${o.name}`);
                    else {
                        if (o.required && optionalSeen) assert.fail(`${where}: required option ${o.name} after an optional one`);
                        if (!o.required) optionalSeen = true;
                    }
                }
            };
            walk(cmd.options, cmd.name);
        }
    });
    it('every command is in the help', () => {
        for (const command of registry.commands.values()) assert.ok(command.category, `${command.data.name} has no category`);
    });
});

describe('economy commands', () => {
    it('profile and balance work for new and returning players', async () => {
        await h.run('profile');
        assert.match(h.lastText(), /Welcome to Project 1B/);
        await h.run('profile');
        assert.doesNotMatch(h.lastText(), /Welcome/);
        await h.run('balance');
        assert.match(h.lastText(), /\$500/);
        const other = fakeUser('Friend');
        await h.run('profile', { options: { user: other } });
        assert.match(h.lastText(), /hasn't started playing/);
        users.ensure(other);
        await h.run('profile', { options: { user: other } });
        assert.match(h.lastText(), /Friend/);
        assertClean();
    });

    it('daily builds a streak and refuses a second claim', async () => {
        await h.run('daily');
        assert.match(h.lastText(), /Streak: \*\*1\*\*/);
        await h.run('daily');
        assert.match(h.lastText(), /already claimed/);
        give(h.user.id, { daily_at: Date.now() - 25 * F.HOUR, daily_streak: 6 });
        await h.run('daily');
        assert.match(h.lastText(), /Streak: \*\*7\*\*/);
        assert.equal(inventory.count(h.user.id, 'rare_chest'), 1);
        await h.run('weekly');
        assert.equal(inventory.count(h.user.id, 'rare_chest'), 2);
        assertClean();
    });

    it('bank deposit, withdraw and info', async () => {
        await h.run('bank', { sub: 'deposit', options: { amount: 'all' } });
        assert.equal(me().bank, 500);
        await h.run('bank', { sub: 'withdraw', options: { amount: '200' } });
        assert.equal(me().wallet, 200);
        await h.run('bank', { sub: 'withdraw', options: { amount: '10k' } });
        assert.match(h.lastText(), /Not enough money/);
        give(h.user.id, { bank: 10_000_000 });
        await h.run('bank', { sub: 'deposit', options: { amount: '100' } });
        assert.match(h.lastText(), /full/);
        await h.run('bank', { sub: 'info' });
        assertClean();
    });

    it('pay moves money with tax and asks before big payments', async () => {
        const friend = fakeUser('Friend');
        await h.run('pay', { options: { user: friend, amount: '100' } });
        assert.equal(users.get(friend.id).wallet, 500 + 97);
        assert.equal(me().wallet, 400);
        give(h.user.id, { wallet: 500_000 });
        h.clicks.push((p) => Harness.button(p, 'Confirm'));
        await h.run('pay', { options: { user: friend, amount: '200k', note: 'merci' } });
        assert.equal(users.get(friend.id).wallet, 597 + 194_000);
        assert.match(h.lastText(), /Generous/, 'sending $100k+ unlocks Generous ($10k reward)');
        assert.equal(me().wallet, 300_000 + 10_000);
        await h.run('pay', { options: { user: h.user, amount: '1' } });
        assert.match(h.lastText(), /yourself/);
        await h.run('pay', { options: { user: fakeUser('Bot', { bot: true }), amount: '1' } });
        assert.match(h.lastText(), /Bots/);
        assertClean();
    });

    it('leaderboard, flex and transactions render', async () => {
        const friend = fakeUser('Friend');
        users.ensure(friend);
        await h.run('leaderboard');
        await h.run('leaderboard', { options: { by: 'level', scope: 'server' } });
        await h.run('flex', { options: { user: friend } });
        assert.match(h.lastText(), /vs/);
        await h.run('transactions');
        assert.match(h.allText(), /Bank statement/);
        assertClean();
    });
});

describe('work and gathering', () => {
    it('work: right answer, wrong answer and no answer', async () => {
        await h.run('job', { sub: 'apply', options: { job: 'barista' } });
        assert.equal(me().job_id, 'barista');

        // Press the correct button: find it by trying each and checking the result text.
        const restore = fixRandom([0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6, 0.8]);
        try {
            h.clicks.push((p) => buttonsOf(p)[0].custom_id);
            await h.run('work');
            assert.match(h.lastText(), /earned/);
            const firstPay = me().wallet - 500;
            assert.ok(firstPay > 0);

            cooldowns.clear(h.user.id, 'work');
            h.clicks.push(null); // timeout
            await h.run('work', { options: { shifts: 2 } });
            assert.match(h.lastText(), /slacked off/);
        } finally {
            restore();
        }

        await h.run('work');
        assert.match(h.lastText(), /breather/);
        cooldowns.clear(h.user.id, 'work');
        give(h.user.id, { energy: 0, energy_at: Date.now() });
        await h.run('work');
        assert.match(h.lastText(), /Too tired/);
        assertClean();
    });

    it('work again button and promotions', async () => {
        users.ensure(h.user);
        give(h.user.id, { level: 9, job_id: 'barista', job_shifts: 19 });
        h.clicks.push((p) => buttonsOf(p)[1].custom_id);
        await h.run('work');
        assert.match(h.allText(), /Promotion/);
        const again = Harness.button(h.last('editReply') ?? h.last('update'), 'Work again');
        assert.ok(again);
        cooldowns.clear(h.user.id, 'work');
        h.clicks.push((p) => buttonsOf(p)[2].custom_id);
        await h.press(again);
        assert.ok(h.records.some((r) => r.kind === 'update'));
        await h.press(again, { user: fakeUser('Stranger') });
        assert.match(h.lastText(), /own job/);
        assertClean();
    });

    it('job list, info, switch and quit', async () => {
        await h.run('job', { sub: 'list' });
        await h.run('job', { sub: 'info', options: { job: 'designer' } });
        assert.match(h.lastText(), /meilleur designer/);
        await h.run('job', { sub: 'apply', options: { job: 'ingenieur' } });
        assert.match(h.lastText(), /level/);
        await h.run('job', { sub: 'apply', options: { job: 'barista' } });
        give(h.user.id, { level: 10 });
        cooldowns.clear(h.user.id, 'job_change');
        h.clicks.push((p) => Harness.button(p, 'Switch'));
        await h.run('job', { sub: 'apply', options: { job: 'ingenieur' } });
        assert.equal(me().job_id, 'ingenieur');
        h.clicks.push((p) => Harness.button(p, 'Quit'));
        await h.run('job', { sub: 'quit' });
        assert.equal(me().job_id, null);
        assertClean();
    });

    it('fish, mine, dig with buttons to go again and sell', async () => {
        await h.run('fish');
        assert.match(h.lastText(), /Fishing Rod/);
        give(h.user.id, { wallet: 10_000 });
        await h.run('buy', { options: { item: 'fishing_rod' } });
        await h.run('buy', { options: { item: 'pickaxe' } });
        await h.run('buy', { options: { item: 'shovel', amount: '2' } });
        assert.equal(inventory.count(h.user.id, 'shovel'), 2);
        for (const activity of ['fish', 'mine', 'dig']) {
            await h.run(activity);
            assert.match(h.lastText(), /energy/);
        }
        const again = Harness.button(h.last(), 'Dig again');
        cooldowns.clear(h.user.id, 'dig');
        await h.press(again);
        assert.equal(h.records[h.records.length - 1].kind, 'update');
        inventory.add(h.user.id, 'sardine', 5);
        await h.press(Harness.button(h.last(), 'sellloot'));
        assert.match(h.lastText(), /Sold your loot/);
        assertClean();
    });
});

describe('items', () => {
    it('shop, select aisles and buy buttons', async () => {
        await h.run('shop');
        assert.match(h.lastText(), /Le Shop/);
        await h.press('p1b:shopcat', { values: ['consumable'] });
        assert.match(h.lastText(), /Energy Drink/);
        await h.press('p1b:buy:coffee');
        assert.equal(inventory.count(h.user.id, 'coffee'), 1);
        assert.match(h.lastText(), /Bought/);
        await h.press('p1b:buy:laptop');
        assert.match(h.lastText(), /Not enough money/);
        assertClean();
    });

    it('buy, sell, use, inventory, item and craft', async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 50_000 });
        await h.run('buy', { options: { item: 'energy drink', amount: '2' } });
        await h.run('buy', { options: { item: 'diamond' } });
        assert.match(h.lastText(), /isn't sold/);
        await h.run('use', { options: { item: 'energy_drink', amount: 2 } });
        assert.match(h.lastText(), /energy/);
        inventory.add(h.user.id, 'common_chest', 3);
        await h.run('use', { options: { item: 'common_chest', amount: 3 } });
        assert.match(h.lastText(), /opened/);
        inventory.add(h.user.id, 'iron_ore', 6);
        inventory.add(h.user.id, 'coal', 2);
        await h.run('craft');
        assert.match(h.lastText(), /Workshop/);
        await h.run('craft', { options: { recipe: 'iron_bar', amount: 2 } });
        assert.equal(inventory.count(h.user.id, 'iron_bar'), 2);
        await h.run('craft', { options: { recipe: 'royal_crown' } });
        assert.match(h.lastText(), /level/);
        await h.run('inventory');
        assert.match(h.lastText(), /Iron Bar/);
        await h.run('inventory', { options: { category: 'tool' } });
        await h.run('item', { options: { name: 'gold bar' } });
        assert.match(h.lastText(), /Recipe/);
        await h.run('sell', { options: { item: 'iron_bar', amount: '1' } });
        assert.equal(inventory.count(h.user.id, 'iron_bar'), 1);
        await h.run('sell', { options: { item: '@loot' } });
        assertClean();
    });

    it('autocompletes stay within Discord limits', async () => {
        users.ensure(h.user);
        inventory.add(h.user.id, 'sardine', 3);
        assert.ok((await h.autocomplete('buy', 'item', { options: { item: 'co' } })).length > 0);
        assert.ok((await h.autocomplete('sell', 'item', { options: { item: '' } })).some((c) => c.value === '@loot'));
        await h.autocomplete('use', 'item', { options: { item: '' } });
        await h.autocomplete('craft', 'recipe', { options: { recipe: 'bar' } });
        assert.equal((await h.autocomplete('item', 'name', { options: { name: '' } })).length, 25);
        await h.autocomplete('stocks', 'symbol', { sub: 'view', options: { symbol: 'p' } });
        await h.autocomplete('market', 'item', { sub: 'sell', options: { item: '' } });
        await h.autocomplete('help', 'command', { options: { command: 'st' } });
        assertClean();
    });
});

describe('finance', () => {
    it('stocks market, view, buy, sell and portfolio', async () => {
        users.ensure(h.user);
        require('../src/game/stocks').tick(Date.now() + 1000);
        give(h.user.id, { wallet: 100_000 });
        await h.run('stocks', { sub: 'market' });
        assert.match(h.lastText(), /Discord Street/);
        await h.run('stocks', { sub: 'view', options: { symbol: 'PTAT' } });
        if (require('../src/ui/charts').available()) assert.equal(h.last().files?.[0]?.name, 'chart.png');
        await h.run('stocks', { sub: 'buy', options: { symbol: 'PTAT', shares: '100' } });
        assert.match(h.lastText(), /Order filled/);
        await h.run('stocks', { sub: 'view', options: { symbol: 'patate' } });
        assert.match(h.lastText(), /You own/);
        await h.run('stocks', { sub: 'sell', options: { symbol: 'PTAT', shares: 'half' } });
        await h.run('stocks', { sub: 'portfolio' });
        assert.match(h.lastText(), /PTAT/);
        await h.run('stocks', { sub: 'buy', options: { symbol: 'BSUI', shares: 'max' } });
        await h.run('stocks', { sub: 'sell', options: { symbol: 'EYLX', shares: '1' } });
        assert.match(h.lastText(), /don't own/);
        assertClean();
    });

    it('business directory, buy, empire, collect and upgrade', async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 100_000 });
        await h.run('business', { sub: 'directory' });
        await h.run('business', { sub: 'empire' });
        await h.run('business', { sub: 'buy', options: { business: 'lemonade' } });
        assert.match(h.lastText(), /Grand opening/);
        q('UPDATE businesses SET collected_at = ? WHERE user_id = ?').run(Date.now() - 2 * F.HOUR, h.user.id);
        await h.run('business', { sub: 'empire' });
        const collect = Harness.button(h.last(), 'Collect');
        await h.press(collect);
        assert.match(h.lastText(), /Collected/);
        await h.run('business', { sub: 'collect' });
        assert.match(h.lastText(), /Nothing to collect/);
        h.clicks.push((p) => Harness.button(p, 'Upgrade'));
        await h.run('business', { sub: 'upgrade', options: { business: 'lemonade' } });
        assert.match(h.lastText(), /level \*\*2\*\*/);
        await h.run('business', { sub: 'upgrade', options: { business: 'hotel' } });
        assert.match(h.lastText(), /don't own/);
        await h.press(collect, { user: fakeUser('Thief') });
        assert.match(h.lastText(), /not your empire/);
        assertClean();
    });

    it('market sell, browse, buy, cancel and mine', async () => {
        const seller = fakeUser('Seller');
        users.ensure(seller);
        inventory.add(seller.id, 'diamond', 4);
        await h.run('market', { sub: 'sell', options: { item: 'diamond', quantity: '3', price: '1.2k' }, user: seller });
        assert.match(h.lastText(), /Listed/);
        await h.run('market', { sub: 'sell', options: { item: 'diamond', quantity: '1', price: '10' }, user: seller });
        assert.match(h.lastText(), /shop would pay/);
        await h.run('market', { sub: 'browse' });
        await h.run('market', { sub: 'browse', options: { item: 'diamond' } });
        assert.match(h.lastText(), /#1/);
        give(users.ensure(h.user).id, { wallet: 5_000 });
        await h.run('market', { sub: 'buy', options: { listing: 1, quantity: 2 } });
        assert.equal(inventory.count(h.user.id, 'diamond'), 2);
        await h.run('market', { sub: 'cancel', options: { listing: 1 } });
        assert.match(h.lastText(), /don't have a listing/);
        await h.run('market', { sub: 'cancel', options: { listing: 1 }, user: seller });
        assert.equal(inventory.count(seller.id, 'diamond'), 1);
        await h.run('market', { sub: 'mine', user: seller });
        assertClean();
    });

    it('lottery info and buy', async () => {
        await h.run('lottery', { sub: 'buy', options: { tickets: 1 } });
        assert.match(h.lastText(), /Not enough money/);
        give(users.ensure(h.user).id, { wallet: 5_000 });
        await h.run('lottery', { sub: 'info' });
        assert.match(h.lastText(), /Lottery draw/);
        await h.run('lottery', { sub: 'buy', options: { tickets: 1 } });
        assert.match(h.lastText(), /hold \*\*1\*\*/);
        assertClean();
    });
});

describe('casino', () => {
    it('coinflip, slots (and spin again), roulette', async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 10_000 });
        await h.run('coinflip', { options: { side: 'heads', bet: '100' } });
        assert.match(h.lastText(), /landed on/);
        await h.run('slots', { options: { bet: '100' } });
        const again = Harness.button(h.last(), 'Spin again');
        await h.press(again);
        assert.match(h.lastText(), /Wallet/);
        await h.run('roulette', { options: { on: 'red', bet: '100' } });
        await h.run('roulette', { options: { on: 'number', bet: '100' } });
        assert.match(h.lastText(), /Pick your number/);
        await h.run('roulette', { options: { on: 'number', number: 7, bet: '100' } });
        await h.run('coinflip', { options: { side: 'heads', bet: '10m' } });
        assert.match(h.lastText(), /max bet/);
        assertClean();
    });

    it('blackjack: stand, hit, double and walk away', async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 100_000 });
        for (const action of ['Stand', 'Hit', 'Double', null]) {
            h.clicks.push(action ? (p) => Harness.button(p, action) : null);
            h.clicks.push((p) => Harness.button(p, 'Stand'));
            h.clicks.push((p) => Harness.button(p, 'Stand'));
            await h.run('blackjack', { options: { bet: '1000' } });
            h.clicks.length = 0;
            assert.match(h.lastText(), /Wallet/);
        }
        assertClean();
    });
});

describe('crime', () => {
    it('rob outcomes and passive mode', async () => {
        const victim = fakeUser('Victim');
        users.ensure(victim);
        give(victim.id, { wallet: 50_000 });
        give(users.ensure(h.user).id, { wallet: 10_000 });
        const restore = fixRandom([0.01, 0.5]);
        try {
            await h.run('rob', { options: { user: victim } });
            assert.match(h.lastText(), /getaway/);
        } finally {
            restore();
        }
        await h.run('rob', { options: { user: victim } });
        assert.match(h.lastText(), /again|alert/);
        await h.run('passive', { options: { mode: 'on' } });
        assert.equal(me().passive, 1);
        await h.run('passive', { options: { mode: 'off' } });
        assert.match(h.lastText(), /already|again/);
        await h.run('rob', { options: { user: fakeUser('Ghost') } });
        assert.match(h.lastText(), /hasn't started/);
        assertClean();
    });

    it('heist with a crew', { timeout: 15_000 }, async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 20_000 });
        const friend = fakeUser('Friend');
        users.ensure(friend);
        give(friend.id, { wallet: 20_000 });
        const broke = fakeUser('Broke');
        h.collectorClicks.push((p) => ({ customId: Harness.button(p, 'Join'), user: friend }));
        h.collectorClicks.push((p) => ({ customId: Harness.button(p, 'Join'), user: friend }));
        h.collectorClicks.push((p) => ({ customId: Harness.button(p, 'Join'), user: broke }));
        await h.run('heist');
        assert.match(h.allText(), /Crew \(2\)/);
        assert.match(h.lastText(), /Heist successful|Busted/);
        await h.run('heist');
        assert.match(h.lastText(), /police|laying low/);
        assertClean();
    });
});

describe('progression', () => {
    it('quests, achievements and prestige', async () => {
        await h.run('quests');
        assert.match(h.lastText(), /Daily quests/);
        await h.run('achievements');
        await h.run('prestige');
        assert.match(h.lastText(), /You need/);
        economy.credit(h.user.id, F.BILLION, 'admin', null, 'bank');
        guilds.update('guild1', 'announce_channel_id', 'chan1');
        h.clicks.push((p) => Harness.button(p, 'Prestige'));
        await h.run('prestige');
        assert.equal(me().prestige, 1);
        assert.ok(h.sentToChannel.some((p) => textOf(p).includes('Project 1B completed')));
        await h.run('profile');
        assert.match(h.lastText(), /Prestige 1/);
        assertClean();
    });
});

describe('journey and scheduler', () => {
    it('journey shows the forecast and a chart once there is history', async () => {
        await h.run('journey');
        assert.match(h.lastText(), /road to 1B/);
        assert.match(h.lastText(), /Come back tomorrow/);
        const journey = require('../src/game/journey');
        journey.snapshot(Date.now() - 3 * F.DAY);
        give(h.user.id, { bank: 50_000 });
        await h.run('journey');
        assert.match(h.lastText(), /At this pace/);
        if (require('../src/ui/charts').available()) assert.equal(h.last().files?.[0]?.name, 'journey.png');
        assertClean();
    });

    it('a scheduler tick moves stocks, snapshots, draws due lotteries and announces', async () => {
        const scheduler = require('../src/core/scheduler');
        const state = require('../src/game/state');
        const lottery = require('../src/game/lottery');
        users.ensure(h.user);
        give(h.user.id, { wallet: 10_000 });
        lottery.buy(h.user.id, 2);
        q('UPDATE lottery_draws SET draws_at = ? WHERE drawn_at IS NULL').run(Date.now() - 1000);
        guilds.update('guild1', 'announce_channel_id', 'chan1');
        const monday = new Date();
        monday.setUTCDate(monday.getUTCDate() + ((8 - monday.getUTCDay()) % 7));
        h.client.user.setPresence = () => {};
        await scheduler.tick(h.client, monday.getTime());
        assert.ok(state.get('stocks_last_tick'));
        assert.equal(state.get('snapshot_day'), monday.toISOString().slice(0, 10));
        assert.ok(h.sentToChannel.some((p) => textOf(p).includes('won the jackpot')), 'lottery announced');
        assert.ok(h.sentToChannel.some((p) => textOf(p).includes('Forbes')), 'Forbes list posted on Monday');
        assertClean();
    });
});

describe('server and utility', () => {
    it('economy, config and help', async () => {
        await h.run('economy');
        assert.match(h.lastText(), /State of the economy/);
        await h.run('config', { sub: 'view' });
        await h.run('config', { sub: 'drops', options: { enabled: true, channel: { id: 'chan1' } } });
        assert.equal(guilds.settings('guild1').drops, 1);
        await h.run('config', { sub: 'announcements', options: { channel: null } });
        await h.run('help');
        assert.match(h.lastText(), /race to/);
        for (const folder of Object.keys(registry.CATEGORIES).filter((f) => !registry.CATEGORIES[f].hidden)) {
            await h.press('p1b:help', { values: [folder] });
        }
        await h.press('p1b:help', { values: ['home'] });
        await h.run('help', { options: { command: 'stocks' } });
        assert.match(h.lastText(), /portfolio/);
        await h.run('help', { options: { command: 'admin' } });
        assert.match(h.lastText(), /no `\/admin`/);
        assertClean();
    });

    it('ping, botinfo, userinfo, serverinfo, rickroll, emoji, clear', async () => {
        for (const name of ['ping', 'botinfo', 'userinfo', 'serverinfo']) await h.run(name);
        q("INSERT OR IGNORE INTO words (type, word) VALUES ('rickroll', 'https://example.com/rick.gif')").run();
        require('../src/game/words').load();
        await h.run('rickroll', { options: { user: fakeUser('Victim') } });
        await h.run('emoji', { options: { emoji: '<:patate:123456789012345678>' } });
        await h.run('emoji', { options: { emoji: '🥔' } });
        assert.match(h.lastText(), /not a custom emoji/);
        await h.run('clear', { options: { amount: 5 } });
        assert.match(h.lastText(), /Deleted/);
        assertClean();
    });

    it('weather, crypto, news and meme with the network mocked', async () => {
        config.weatherToken = config.weatherToken || 'test';
        config.newsApiKey = config.newsApiKey || 'test';
        axios.get = async (url) => {
            if (url.includes('openweathermap')) return { data: { name: 'Troyes', sys: { country: 'FR' }, weather: [{ description: 'clear sky', icon: '01d' }], main: { temp: 21, feels_like: 20, temp_min: 18, temp_max: 24, humidity: 40, pressure: 1015 }, wind: { speed: 3 }, coord: { lat: 48.3, lon: 4.08 } } };
            if (url.includes('coingecko')) return { data: { bitcoin: { usd: 86000, usd_24h_change: 1.5 } } };
            if (url.includes('newsapi')) return { data: { articles: [{ title: 'News', description: 'Something', url: 'https://example.com', urlToImage: 'https://example.com/a.png', source: { name: 'Ex' }, publishedAt: new Date().toISOString() }] } };
            if (url.includes('eylexander')) throw new Error('down');
            return { data: { title: 'meme', url: 'https://i.redd.it/x.png', postLink: 'https://redd.it/x', subreddit: 'memes', nsfw: false, spoiler: false } };
        };
        await h.run('weather', { options: { city: 'Troyes' } });
        assert.match(h.lastText(), /21°C/);
        await h.run('crypto', { options: { coin: 'bitcoin' } });
        assert.match(h.lastText(), /86,000/);
        await h.run('crypto', { options: { coin: 'nope' } });
        assert.match(h.lastText(), /No price/);
        await h.run('news', { options: { topic: 'crypto' } });
        await h.run('meme');
        assert.match(h.lastText(), /meme/);
        axios.get = originalGet;
        assertClean();
    });

    it('suggest opens a modal and stores the idea', async () => {
        await h.run('suggest');
        assert.equal(h.last('modal').custom_id, 'p1b:suggest');
        await h.submitModal('p1b:suggest', { title: 'Fromager job', body: 'Cheese!' });
        assert.equal(q('SELECT COUNT(*) AS c FROM suggestions').get().c, 1);
        assertClean();
    });
});

describe('owner tools and safety rails', () => {
    it('admin commands are owner only', async () => {
        await h.run('admin', { group: 'money', sub: 'give', options: { user: h.user, amount: '1m' } });
        assert.match(h.lastText(), /Only the bot owner/);
    });

    it('admin commands work for the owner', async () => {
        const owner = fakeUser('Owner', { id: config.ownerId || '1' });
        config.ownerId = owner.id;
        const target = fakeUser('Target');
        await h.run('admin', { group: 'money', sub: 'give', options: { user: target, amount: '1m' }, user: owner });
        assert.equal(users.get(target.id).wallet, 1_000_500);
        await h.run('admin', { group: 'money', sub: 'take', options: { user: target, amount: '500', account: 'wallet' }, user: owner });
        await h.run('admin', { group: 'item', sub: 'give', options: { user: target, item: 'golden koi', quantity: 2 }, user: owner });
        assert.equal(inventory.count(target.id, 'golden_koi'), 2);
        await h.run('admin', { group: 'player', sub: 'inspect', options: { user: target }, user: owner });
        await h.run('admin', { group: 'player', sub: 'level', options: { user: target, level: 25 }, user: owner });
        assert.equal(users.get(target.id).level, 25);
        await h.run('admin', { group: 'event', sub: 'golden-hour', options: { minutes: 10 }, user: owner });
        await h.run('admin', { group: 'event', sub: 'drop', user: owner });
        assert.ok(h.sentToChannel.some((p) => textOf(p).includes('treasure chest')));
        await h.run('admin', { group: 'event', sub: 'lottery-draw', user: owner });
        await h.run('admin', { group: 'event', sub: 'stocks-tick', options: { ticks: 3 }, user: owner });
        await h.run('admin', { group: 'words', sub: 'add', options: { type: 'badword', word: 'zut' }, user: owner });
        await h.run('admin', { group: 'words', sub: 'list', user: owner });
        assert.match(h.lastText(), /zut/);
        await h.run('admin', { group: 'ban', sub: 'add', options: { user: target, reason: 'testing' }, user: owner });
        await h.run('profile', { user: target });
        assert.match(h.lastText(), /banned/);
        await h.run('admin', { group: 'ban', sub: 'list', user: owner });
        await h.run('admin', { group: 'ban', sub: 'remove', options: { user: target }, user: owner });
        await h.run('admin', { group: 'bot', sub: 'suggestions', user: owner });
        h.clicks.push((p) => Harness.button(p, 'Wipe'));
        await h.run('admin', { group: 'player', sub: 'reset', options: { user: target }, user: owner });
        assert.equal(users.get(target.id), undefined);
        assertClean();
    });

    it('the slash command rate limit kicks in', async () => {
        await h.run('ping');
        await h.run('ping', { keepRateLimit: true });
        assert.match(h.lastText(), /Slow down/);
    });
});

describe('chat events', () => {
    it('drops spawn, can be grabbed once, and chat pays players', async () => {
        const messageCreate = require('../src/events/messageCreate');
        guilds.update('guild1', 'drops', 1);
        users.ensure(h.user);
        const restore = fixRandom([0.001]);
        let message;
        try {
            message = {
                author: h.user,
                system: false,
                content: 'hello everyone',
                guild: h.guild,
                guildId: h.guild.id,
                channel: h.channel,
                reply: async (o) => h.record('messageReply', o),
            };
            await messageCreate.execute(h.client, message);
        } finally {
            restore();
        }
        const drop = q('SELECT * FROM drops').get();
        assert.ok(drop, 'a drop spawned');
        assert.ok(me().wallet > 500, 'chatting paid something');
        await h.press(`p1b:drop:${drop.id}`);
        assert.match(h.lastText(), /claimed/);
        await h.press(`p1b:drop:${drop.id}`, { user: fakeUser('Late') });
        assert.match(h.lastText(), /Too slow/);
        message.content = 'I think about suicide sometimes';
        await messageCreate.execute(h.client, message);
        assert.ok(h.sentToChannel.some((p) => textOf(p).includes('3114')));
        assertClean();
    });
});

describe('error paths', () => {
    it('an action that fails after Confirm shows the error on the clicked message', async () => {
        users.ensure(h.user);
        give(h.user.id, { wallet: 1_000_000 });
        const friend = fakeUser('Friend');
        h.clicks.push((p) => {
            give(h.user.id, { wallet: 0 }); // spent it all while the dialog was open
            return Harness.button(p, 'Confirm');
        });
        await h.run('pay', { options: { user: friend, amount: '200k' } });
        const final = h.records[h.records.length - 1];
        assert.equal(final.kind, 'update');
        assert.match(textOf(final.options), /Not enough money/);
        assertClean();
    });

    it('works when Discord does not echo the message back', async () => {
        h.omitResource = true;
        users.ensure(h.user);
        h.clicks.push((p) => buttonsOf(p)[0].custom_id);
        await h.run('work');
        assert.match(h.lastText(), /earned/);
        await h.run('transactions');
        await h.run('ping');
        assertClean();
    });

    it('banned players cannot press buttons either', async () => {
        users.ensure(h.user);
        q("INSERT INTO bot_bans (user_id, reason, banned_at) VALUES (?, 'test', 0)").run(h.user.id);
        await h.press('p1b:buy:coffee');
        assert.match(h.lastText(), /banned/);
        assert.equal(inventory.count(h.user.id, 'coffee'), 0);
    });

    it('an API failure replaces the loading card', async () => {
        config.weatherToken = config.weatherToken || 'test';
        axios.get = async () => {
            throw new Error('network down');
        };
        try {
            await h.run('weather', { options: { city: 'Atlantis' } });
        } finally {
            axios.get = originalGet;
        }
        const final = h.records[h.records.length - 1];
        assert.equal(final.kind, 'editReply');
        assert.match(textOf(final.options), /Atlantis/);
        assertClean();
    });

    it('v1 prefix commands get a pointer to the slash command', async () => {
        const messageCreate = require('../src/events/messageCreate');
        const replies = [];
        await messageCreate.execute(h.client, {
            author: h.user, system: false, content: '+work all', guild: h.guild, guildId: h.guild.id, channel: h.channel,
            reply: async (o) => replies.push(o),
        });
        assert.equal(replies.length, 1);
        assert.match(replies[0].content, /\/work/);
    });
});
