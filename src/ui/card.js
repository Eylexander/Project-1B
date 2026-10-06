const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MediaGalleryBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder,
} = require('discord.js');
const theme = require('./theme');

const TEXT_LIMIT = 4000;

/**
 * A Components V2 "card": one accent-coloured container with a header, text,
 * dividers and buttons. Consecutive text is merged into one text display to stay
 * well under Discord's 40-component limit.
 */
class Card {
    constructor({ title, subtitle, emoji, color = theme.brand, thumbnail } = {}) {
        this.color = color;
        this.ops = [];
        if (title) this.ops.push({ kind: 'header', title, subtitle, emoji, thumbnail });
    }

    text(content) {
        if (content !== null && content !== undefined && content !== false) this.ops.push({ kind: 'text', content: String(content) });
        return this;
    }

    lines(list) {
        return this.text(list.filter((l) => l !== null && l !== undefined && l !== false).join('\n'));
    }

    divider({ large = false, visible = true } = {}) {
        this.ops.push({ kind: 'separator', large, visible });
        return this;
    }

    /** Text with a thumbnail (image URL) or a button on its right. */
    section(content, accessory) {
        this.ops.push({ kind: 'section', content, accessory });
        return this;
    }

    image(url) {
        this.ops.push({ kind: 'image', url });
        return this;
    }

    buttons(...buttons) {
        const list = buttons.flat().filter(Boolean);
        for (let i = 0; i < list.length; i += 5) this.ops.push({ kind: 'row', components: list.slice(i, i + 5) });
        return this;
    }

    select(menu) {
        this.ops.push({ kind: 'row', components: [menu] });
        return this;
    }

    /** Level-ups, quests and achievements that happened during this action. */
    notices(list) {
        if (list?.length) this.divider().text(list.join('\n'));
        return this;
    }

    footer(content) {
        if (content) this.ops.push({ kind: 'text', content: `-# ${content}` });
        return this;
    }

    build() {
        const container = new ContainerBuilder().setAccentColor(this.color);
        let buffer = [];
        const flush = () => {
            const content = buffer.join('\n').trim();
            buffer = [];
            // Discord rejects empty text displays.
            if (content) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(clip(content)));
        };

        for (const op of this.ops) {
            switch (op.kind) {
                case 'header': {
                    const text = `### ${op.emoji ? `${op.emoji} ` : ''}${op.title}${op.subtitle ? `\n-# ${op.subtitle}` : ''}`;
                    if (op.thumbnail) {
                        flush();
                        container.addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(new TextDisplayBuilder().setContent(text))
                                .setThumbnailAccessory(new ThumbnailBuilder().setURL(op.thumbnail)),
                        );
                    } else {
                        buffer.push(text);
                    }
                    break;
                }
                case 'text':
                    buffer.push(op.content);
                    break;
                case 'separator':
                    flush();
                    container.addSeparatorComponents((s) =>
                        s.setDivider(op.visible).setSpacing(op.large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small));
                    break;
                case 'section': {
                    flush();
                    const section = new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(clip(op.content)));
                    if (op.accessory instanceof ButtonBuilder) section.setButtonAccessory(op.accessory);
                    else section.setThumbnailAccessory(new ThumbnailBuilder().setURL(op.accessory));
                    container.addSectionComponents(section);
                    break;
                }
                case 'image':
                    flush();
                    container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems((item) => item.setURL(op.url)));
                    break;
                case 'row':
                    flush();
                    container.addActionRowComponents(new ActionRowBuilder().addComponents(op.components));
                    break;
                default:
                    break;
            }
        }
        flush();
        // A container needs at least one child.
        if (!container.components.length) container.addTextDisplayComponents(new TextDisplayBuilder().setContent('​'));
        return container;
    }
}

function clip(text) {
    return text.length > TEXT_LIMIT ? `${text.slice(0, TEXT_LIMIT - 1)}…` : text;
}

function toComponents(cards) {
    return (Array.isArray(cards) ? cards : [cards]).filter(Boolean).map((c) => (c instanceof Card ? c.build() : c));
}

/** Options for reply()/followUp(). Mentions never ping unless listed in `ping`. */
function payload(cards, { ephemeral = false, rows = [], ping = [], files = [] } = {}) {
    return {
        components: [...toComponents(cards), ...rows],
        flags: MessageFlags.IsComponentsV2 | (ephemeral ? MessageFlags.Ephemeral : 0),
        allowedMentions: { parse: [], users: ping },
        ...(files.length ? { files } : {}),
    };
}

/** Options for update()/editReply() (the ephemeral flag can't be changed after sending). */
function edit(cards, { rows = [], ping = [] } = {}) {
    return {
        components: [...toComponents(cards), ...rows],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [], users: ping },
    };
}

function button(customId, label, { style = ButtonStyle.Secondary, emoji, disabled = false } = {}) {
    const b = new ButtonBuilder().setCustomId(customId).setStyle(style).setDisabled(disabled);
    if (label) b.setLabel(label);
    if (emoji) b.setEmoji(emoji);
    return b;
}

function linkButton(url, label, emoji) {
    const b = new ButtonBuilder().setURL(url).setStyle(ButtonStyle.Link).setLabel(label);
    if (emoji) b.setEmoji(emoji);
    return b;
}

function errorCard(title, message, emoji = '⚠️') {
    return new Card({ title, emoji, color: theme.danger }).text(message);
}

module.exports = { Card, payload, edit, button, linkButton, errorCard, ButtonStyle };
