const numberFormat = new Intl.NumberFormat('en-US');

function num(value) {
    return numberFormat.format(Math.trunc(value));
}

function money(value) {
    const sign = value < 0 ? '-' : '';
    return `${sign}$${num(Math.abs(value))}`;
}

/** $1.23M style, for tight spaces. */
function compact(value) {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    const units = [
        [1e12, 'T'],
        [1e9, 'B'],
        [1e6, 'M'],
        [1e3, 'K'],
    ];
    for (const [size, suffix] of units) {
        if (abs >= size) {
            const scaled = abs / size;
            const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
            return `${sign}$${scaled.toFixed(digits).replace(/\.0+$/, '')}${suffix}`;
        }
    }
    return money(value);
}

/** Price stored in cents (possibly fractional) -> "$12.34". */
function cents(value) {
    const sign = value < 0 ? '-' : '';
    const rounded = Math.round(Math.abs(value));
    return `${sign}$${num(Math.floor(rounded / 100))}.${String(rounded % 100).padStart(2, '0')}`;
}

function pct(fraction, { sign = true, digits = 2 } = {}) {
    const value = (fraction * 100).toFixed(digits);
    return `${sign && fraction >= 0 ? '+' : ''}${value}%`;
}

function bar(fraction, length = 10) {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
    const filled = Math.round(clamped * length);
    return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}

const SPARKS = '▁▂▃▄▅▆▇█';
function sparkline(values) {
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values.map((v) => SPARKS[Math.round(((v - min) / span) * (SPARKS.length - 1))]).join('');
}

function duration(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m && parts.length < 2) parts.push(`${m}m`);
    if (s && parts.length < 2 && !d) parts.push(`${s}s`);
    return parts.join(' ') || '0s';
}

/** Discord timestamp that renders in the viewer's timezone ("in 5 minutes"). */
function relative(ms) {
    return `<t:${Math.floor(ms / 1000)}:R>`;
}

function timestamp(ms, style = 'f') {
    return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

function plural(count, word, pluralWord = `${word}s`) {
    return `${num(count)} ${count === 1 ? word : pluralWord}`;
}

function itemLabel(item, quantity) {
    return `${item.emoji} ${item.name}${quantity != null && quantity !== 1 ? ` ×${num(quantity)}` : ''}`;
}

module.exports = { num, money, compact, cents, pct, bar, sparkline, duration, relative, timestamp, plural, itemLabel };
