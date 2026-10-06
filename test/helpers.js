// Shared setup: an in-memory database, fake Discord objects, and a validator for
// Components V2 payloads so tests catch anything Discord would reject.
process.env.P1B_SKIP_LEGACY = '1';
process.env.P1B_QUIET = '1';
process.env.P1B_NO_FILE_LOGS = '1';

const { EventEmitter } = require('node:events');
const { MessageFlags, ComponentType } = require('discord.js');
const db = require('../src/db');
const rng = require('../src/game/rng');

function freshDb() {
    db.useDatabase(':memory:');
    require('../src/game/stocks').seed();
    require('../src/game/words').load();
    return db;
}

/** Replaces rng.random with a fixed sequence (cycled) until restore() is called. */
function fixRandom(values) {
    const original = rng.random;
    let i = 0;
    rng.random = () => values[i++ % values.length];
    return () => {
        rng.random = original;
    };
}

let idCounter = 100000000000000000n;
function fakeUser(name = 'Player', { id, bot = false } = {}) {
    const userId = id ?? String(idCounter++);
    return {
        id: userId,
        username: name.toLowerCase(),
        globalName: name,
        displayName: name,
        bot,
        createdTimestamp: Date.now() - 1e10,
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
        toString: () => `<@${userId}>`,
    };
}

// ---------- Components V2 validation ----------

function toJSON(component) {
    return typeof component?.toJSON === 'function' ? component.toJSON() : component;
}

function validateComponent(c, counter, problems, path) {
    counter.count++;
    const p = (msg) => problems.push(`${path}: ${msg}`);
    switch (c.type) {
        case ComponentType.Container:
            if (!c.components?.length) p('empty container');
            c.components?.forEach((child, i) => validateComponent(child, counter, problems, `${path}.container[${i}]`));
            break;
        case ComponentType.TextDisplay:
            if (!c.content || !c.content.length) p('empty text display');
            counter.text += c.content?.length ?? 0;
            break;
        case ComponentType.Section:
            if (!c.components?.length || c.components.length > 3) p(`section has ${c.components?.length} texts`);
            if (!c.accessory) p('section without accessory');
            c.components?.forEach((child, i) => validateComponent(child, counter, problems, `${path}.section[${i}]`));
            if (c.accessory) validateComponent(c.accessory, counter, problems, `${path}.accessory`);
            break;
        case ComponentType.Thumbnail:
            if (!c.media?.url) p('thumbnail without url');
            break;
        case ComponentType.MediaGallery:
            if (!c.items?.length || c.items.length > 10) p('bad media gallery');
            for (const item of c.items ?? []) if (!item.media?.url) p('gallery item without url');
            break;
        case ComponentType.Separator:
            break;
        case ComponentType.ActionRow: {
            const kids = c.components ?? [];
            if (!kids.length || kids.length > 5) p(`action row with ${kids.length} components`);
            if (kids.some((k) => k.type !== ComponentType.Button) && kids.length > 1) p('select menus must be alone in a row');
            kids.forEach((child, i) => validateComponent(child, counter, problems, `${path}.row[${i}]`));
            break;
        }
        case ComponentType.Button:
            if (!c.label && !c.emoji) p('button without label or emoji');
            if (c.emoji && typeof c.emoji !== 'object') p('emoji must be an object');
            if (c.label && c.label.length > 80) p(`button label too long (${c.label.length})`);
            if (c.style === 5 ? !c.url : !c.custom_id) p('button without custom_id/url');
            if (c.custom_id && c.custom_id.length > 100) p('custom_id too long');
            break;
        case ComponentType.StringSelect:
            if (!c.custom_id) p('select without custom_id');
            if (!c.options?.length || c.options.length > 25) p(`select with ${c.options?.length} options`);
            for (const o of c.options ?? []) {
                if (o.emoji && typeof o.emoji !== 'object') p('select emoji must be an object');
                if (!o.label || o.label.length > 100) p('bad select label');
                if (!o.value || o.value.length > 100) p('bad select value');
                if (o.description && o.description.length > 100) p('select description too long');
            }
            break;
        default:
            p(`unexpected component type ${c.type}`);
    }
}

/** Returns a list of problems with a message payload (empty when Discord would accept it). */
function validatePayload(options) {
    const problems = [];
    if (!options || typeof options !== 'object') return ['payload is not an object'];
    let components;
    try {
        components = (options.components ?? []).map(toJSON);
    } catch (error) {
        return [`builder rejected the payload: ${error.message}`];
    }
    const v2 = Boolean((options.flags ?? 0) & MessageFlags.IsComponentsV2);
    if (v2) {
        if (options.content) problems.push('content is not allowed with Components V2');
        if (options.embeds?.length) problems.push('embeds are not allowed with Components V2');
        const counter = { count: 0, text: 0 };
        components.forEach((c, i) => validateComponent(c, counter, problems, `components[${i}]`));
        if (counter.count > 40) problems.push(`too many components (${counter.count})`);
        if (counter.text > 4000) problems.push(`too much text (${counter.text})`);
        const attached = new Set((options.files ?? []).map((f) => f.name));
        for (const ref of JSON.stringify(components).match(/attachment:\/\/[^"]+/g) ?? []) {
            if (!attached.has(ref.slice('attachment://'.length))) problems.push(`${ref} is referenced but not attached`);
        }
    } else if (!options.content && !options.embeds?.length && !components.length) {
        problems.push('empty message');
    }
    return problems;
}

/** All the text of a payload, for assertions. */
function textOf(options) {
    const out = [];
    const walk = (c) => {
        if (!c) return;
        if (c.content) out.push(c.content);
        if (c.label) out.push(c.label);
        (c.components ?? []).forEach(walk);
        if (c.accessory) walk(c.accessory);
    };
    (options?.components ?? []).map(toJSON).forEach(walk);
    if (options?.content) out.push(options.content);
    return out.join('\n');
}

function buttonsOf(options) {
    const out = [];
    const walk = (c) => {
        if (!c) return;
        if (c.type === ComponentType.Button || c.type === ComponentType.StringSelect) out.push(c);
        (c.components ?? []).forEach(walk);
        if (c.accessory) walk(c.accessory);
    };
    (options?.components ?? []).map(toJSON).forEach(walk);
    return out;
}

module.exports = { freshDb, fixRandom, fakeUser, validatePayload, textOf, buttonsOf, EventEmitter };
