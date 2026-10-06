// A fake Discord: just enough of discord.js's interaction API to run every command
// end to end, record what the bot sends, and click buttons like a player would.
const { Collection } = require('discord.js');
const { EventEmitter } = require('node:events');
const { validatePayload, fakeUser, buttonsOf, textOf } = require('./helpers');
const router = require('../src/core/router');

let messageCounter = 1;

class FakeMessage {
    constructor(harness, options, owner = null) {
        this.harness = harness;
        this.owner = owner;
        this.id = `msg${messageCounter++}`;
        this.createdTimestamp = Date.now() + 7;
        this.current = options;
    }

    async edit(options) {
        this.harness.record('messageEdit', options);
        this.current = options;
        return this;
    }

    async awaitMessageComponent({ filter }) {
        const strategy = this.harness.clicks.shift();
        const pick = typeof strategy === 'function' ? strategy(this.current) : strategy;
        if (!pick) throw new Error('Collector received no interactions before ending with reason: time');
        const spec = typeof pick === 'string' ? { customId: pick } : pick;
        const interaction = new FakeComponent(this.harness, { user: this.owner, ...spec, message: this });
        if (filter && !(await filter(interaction))) throw new Error('filtered out');
        return interaction;
    }

    createMessageComponentCollector({ filter } = {}) {
        const emitter = new EventEmitter();
        const queued = this.harness.collectorClicks.splice(0);
        setImmediate(async () => {
            for (const pick of queued) {
                const spec = typeof pick === 'function' ? pick(this.current) : pick;
                if (!spec) continue;
                const interaction = new FakeComponent(this.harness, { user: this.owner, ...(typeof spec === 'string' ? { customId: spec } : spec), message: this });
                if (!filter || (await filter(interaction))) {
                    emitter.emit('collect', interaction);
                    await new Promise((r) => setImmediate(r));
                }
            }
            emitter.emit('end', new Collection(), 'time');
        });
        return emitter;
    }
}

class Base {
    constructor(harness, { user, guild = true }) {
        this.harness = harness;
        this.user = user ?? harness.user;
        this.client = harness.client;
        this.guild = guild ? harness.guild : null;
        this.guildId = guild ? harness.guild.id : null;
        this.channel = harness.channel;
        this.channelId = harness.channel.id;
        this.appPermissions = { has: () => true };
        this.createdTimestamp = Date.now();
        this.replied = false;
        this.deferred = false;
    }

    isAutocomplete() { return false; }
    isChatInputCommand() { return false; }
    isMessageComponent() { return false; }
    isModalSubmit() { return false; }
    isButton() { return false; }
    isStringSelectMenu() { return false; }

    async reply(options) {
        if (this.replied || this.deferred) throw new Error('Interaction has already been acknowledged.');
        this.harness.record(`${this.kind}Reply`, options);
        this.replied = true;
        this.message = this.message ?? new FakeMessage(this.harness, options, this.user);
        this.message.current = options;
        if (!options.withResponse) return undefined;
        return this.harness.omitResource ? { resource: null } : { resource: { message: this.message } };
    }

    async fetchReply() {
        return this.message;
    }

    async deferReply() {
        if (this.replied || this.deferred) throw new Error('Interaction has already been acknowledged.');
        this.deferred = true;
        this.message = new FakeMessage(this.harness, null, this.user);
    }

    async editReply(options) {
        if (!this.replied && !this.deferred) throw new Error('The reply to this interaction has not been sent or deferred.');
        this.harness.record('editReply', options);
        this.replied = true;
        this.message.current = options;
        return this.message;
    }

    async followUp(options) {
        if (!this.replied && !this.deferred) throw new Error('The reply to this interaction has not been sent or deferred.');
        this.harness.record('followUp', options);
        return new FakeMessage(this.harness, options);
    }
}

class FakeCommand extends Base {
    constructor(harness, { name, sub = null, group = null, options = {}, focused = null, user, guild }) {
        super(harness, { user, guild });
        this.kind = 'command';
        this.commandName = name;
        this.focusedName = focused;
        this.responded = false;
        const values = options;
        const get = (key, required) => {
            if (values[key] === undefined || values[key] === null) {
                if (required) throw new Error(`Missing required option ${key}`);
                return null;
            }
            return values[key];
        };
        this.options = {
            getSubcommand: () => sub,
            getSubcommandGroup: () => group,
            getString: get,
            getInteger: get,
            getBoolean: get,
            getUser: get,
            getChannel: get,
            getFocused: () => String(values[focused] ?? ''),
        };
    }

    isAutocomplete() { return Boolean(this.focusedName); }
    isChatInputCommand() { return !this.focusedName; }

    async respond(choices) {
        this.responded = true;
        this.harness.record('autocomplete', choices);
    }

    async showModal(modal) {
        this.replied = true;
        this.harness.record('modal', modal.toJSON());
    }

    toString() {
        return `/${this.commandName}`;
    }
}

class FakeComponent extends Base {
    constructor(harness, { customId, user, values = [], message = null, fields = null }) {
        super(harness, { user: user ?? undefined });
        this.kind = fields ? 'modal' : 'component';
        this.customId = customId;
        this.values = values;
        this.message = message ?? new FakeMessage(harness, null, this.user);
        this.fieldValues = fields;
        this.fields = fields ? { getTextInputValue: (key) => fields[key] } : null;
    }

    isMessageComponent() { return !this.fieldValues; }
    isModalSubmit() { return Boolean(this.fieldValues); }
    isButton() { return !this.fieldValues && !this.values.length; }
    isStringSelectMenu() { return this.values.length > 0; }

    async update(options) {
        if (this.replied || this.deferred) throw new Error('Interaction has already been acknowledged.');
        this.harness.record('update', options);
        this.replied = true;
        this.message.current = options;
    }

    async reply(options) {
        if (this.replied || this.deferred) throw new Error('Interaction has already been acknowledged.');
        this.harness.record('componentReply', options);
        this.replied = true;
        return options.withResponse ? { resource: { message: this.message } } : undefined;
    }

    async editReply(options) {
        this.harness.record('editReply', options);
        this.message.current = options;
        return this.message;
    }
}

class Harness {
    constructor() {
        this.user = fakeUser('Tester');
        this.records = [];
        this.problems = [];
        this.clicks = [];
        this.collectorClicks = [];
        this.sentToChannel = [];
        const channel = {
            id: 'chan1',
            name: 'general',
            isTextBased: () => true,
            send: async (options) => {
                this.record('channelSend', options);
                this.sentToChannel.push(options);
                return new FakeMessage(this, options);
            },
            messages: { fetch: async () => new Collection([['m1', { id: 'm1', author: this.user }], ['m2', { id: 'm2', author: this.user }]]) },
            bulkDelete: async (list) => new Collection(list.map((m) => [m.id, m])),
        };
        this.channel = channel;
        const guild = {
            id: 'guild1',
            name: 'Test Server',
            description: null,
            memberCount: 42,
            createdTimestamp: Date.now() - 1e10,
            premiumSubscriptionCount: 0,
            premiumTier: 0,
            iconURL: () => null,
            channels: { cache: new Collection([['chan1', channel]]) },
            roles: { cache: new Collection([['guild1', { id: 'guild1', position: 0 }]]) },
            members: { fetch: async () => null },
            fetchOwner: async () => ({ user: this.user }),
        };
        guild.fetch = async () => guild;
        this.guild = guild;
        this.client = {
            user: { id: 'bot1', tag: 'Project 1B#0001', displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/1.png' },
            guilds: { cache: new Collection([['guild1', guild]]) },
            ws: { ping: 42 },
            uptime: 123_456,
            channels: { fetch: async () => channel },
            users: { fetch: async (id) => ({ ...fakeUser('Owner', { id }), send: async (o) => this.record('dm', o) }) },
        };
    }

    record(kind, options) {
        this.records.push({ kind, options });
        if (kind === 'autocomplete') {
            if (!Array.isArray(options) || options.length > 25) this.problems.push(`autocomplete returned ${options?.length} choices`);
            for (const c of options) if (!c.name || c.name.length > 100 || String(c.value).length > 100) this.problems.push(`bad autocomplete choice ${JSON.stringify(c)}`);
            return;
        }
        if (kind === 'modal') return;
        for (const problem of validatePayload(options)) this.problems.push(`${kind}: ${problem}`);
    }

    last(kind = null) {
        const list = kind ? this.records.filter((r) => r.kind === kind) : this.records;
        return list[list.length - 1]?.options;
    }

    lastText() {
        const r = this.records.filter((x) => x.kind !== 'autocomplete' && x.kind !== 'modal');
        return textOf(r[r.length - 1]?.options);
    }

    allText() {
        return this.records.filter((x) => x.kind !== 'autocomplete' && x.kind !== 'modal').map((r) => textOf(r.options)).join('\n');
    }

    /** Runs a slash command through the real router. */
    async run(name, { sub, group, options, user, guild, keepRateLimit = false } = {}) {
        if (!keepRateLimit) router.resetRateLimits();
        const interaction = new FakeCommand(this, { name, sub, group, options, user, guild });
        await router.handle(interaction);
        return interaction;
    }

    async autocomplete(name, focused, { sub, options = {}, user } = {}) {
        const interaction = new FakeCommand(this, { name, sub, options, focused, user });
        await router.handle(interaction);
        return this.last('autocomplete');
    }

    /** Presses a persistent (p1b:) button or select through the router. */
    async press(customId, { user, values = [], message } = {}) {
        const interaction = new FakeComponent(this, { customId, user, values, message });
        await router.handle(interaction);
        return interaction;
    }

    async submitModal(customId, fields, { user } = {}) {
        const interaction = new FakeComponent(this, { customId, user, fields });
        await router.handle(interaction);
        return interaction;
    }

    /** The custom id of a button on a payload whose label/emoji matches. */
    static button(options, match) {
        const found = buttonsOf(options).find((b) => (b.label && b.label.includes(match)) || b.custom_id?.includes(match));
        return found?.custom_id ?? null;
    }

    errors() {
        return this.records.filter((r) => /Hold on|Something broke|Not enough|Cooldown|Banned/.test(textOf(r.options)));
    }
}

module.exports = { Harness, FakeMessage };
