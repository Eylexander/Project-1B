const fs = require('node:fs');
const logger = require('../core/logger');

// Optional: @napi-rs/canvas renders PNG charts. Without it, commands fall back to text.
let canvas = null;
try {
    canvas = require('@napi-rs/canvas');
    const fonts = [
        ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'Chart Sans'],
        ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'Chart Sans Bold'],
    ];
    for (const [file, family] of fonts) if (fs.existsSync(file)) canvas.GlobalFonts.registerFromPath(file, family);
} catch {
    canvas = null;
}

const COLORS = {
    background: '#15171c',
    grid: '#262a33',
    label: '#8b93a1',
    title: '#f2f3f5',
    up: '#2ecc71',
    down: '#e74c3c',
    gold: '#f5b700',
};

function available() {
    return Boolean(canvas);
}

function formatCents(value) {
    const dollars = value / 100;
    if (dollars >= 1000) return `$${Math.round(dollars).toLocaleString('en-US')}`;
    return `$${dollars.toFixed(2)}`;
}

function formatCompact(value) {
    const units = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (const [size, suffix] of units) {
        if (Math.abs(value) >= size) return `$${(value / size).toFixed(value / size >= 100 ? 0 : 1).replace(/\.0$/, '')}${suffix}`;
    }
    return `$${Math.round(value)}`;
}

/**
 * Draws a dark line chart and returns a PNG buffer (or null).
 *   values      numbers, oldest first
 *   title       big text top-left, subtitle next to it
 *   headline    text top-right (e.g. the price), in the line colour
 *   note        small grey text after the headline
 *   format      y-axis label formatter
 *   startLabel / endLabel   x-axis labels
 */
function lineChart(values, { title, subtitle = '', headline = '', note = '', format = String, startLabel = '', endLabel = 'now', color = null }) {
    if (!canvas || values.length < 2) return null;
    try {
        const width = 800;
        const height = 320;
        const pad = { top: 56, right: 96, bottom: 34, left: 20 };
        const image = canvas.createCanvas(width, height);
        const ctx = image.getContext('2d');

        ctx.fillStyle = COLORS.background;
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, 18);
        ctx.fill();

        const first = values[0];
        const last = values[values.length - 1];
        const line = color ?? (last >= first ? COLORS.up : COLORS.down);
        let min = Math.min(...values);
        let max = Math.max(...values);
        if (max === min) {
            const spread = Math.max(1, Math.abs(max) * 0.05);
            max += spread;
            min -= spread;
        }
        const plotW = width - pad.left - pad.right;
        const plotH = height - pad.top - pad.bottom;
        const x = (i) => pad.left + (i / (values.length - 1)) * plotW;
        const y = (v) => pad.top + (1 - (v - min) / (max - min)) * plotH;

        ctx.font = '14px "Chart Sans"';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const value = min + ((max - min) * i) / 4;
            const gy = y(value);
            ctx.strokeStyle = COLORS.grid;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, gy);
            ctx.lineTo(pad.left + plotW, gy);
            ctx.stroke();
            ctx.fillStyle = COLORS.label;
            ctx.fillText(format(value), pad.left + plotW + 12, gy);
        }

        const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
        gradient.addColorStop(0, `${line}66`);
        gradient.addColorStop(1, `${line}00`);
        ctx.beginPath();
        ctx.moveTo(x(0), y(values[0]));
        values.forEach((v, i) => ctx.lineTo(x(i), y(v)));
        ctx.lineTo(x(values.length - 1), pad.top + plotH);
        ctx.lineTo(x(0), pad.top + plotH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        values.forEach((v, i) => (i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v))));
        ctx.strokeStyle = line;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x(values.length - 1), y(last), 5, 0, Math.PI * 2);
        ctx.fillStyle = line;
        ctx.fill();

        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = COLORS.title;
        ctx.font = '22px "Chart Sans Bold"';
        ctx.fillText(title, pad.left + 4, 36);
        const titleWidth = ctx.measureText(title).width;
        ctx.font = '16px "Chart Sans"';
        ctx.fillStyle = COLORS.label;
        ctx.fillText(subtitle, pad.left + 16 + titleWidth, 36);

        ctx.textAlign = 'right';
        let right = width - 20;
        if (note) {
            ctx.font = '14px "Chart Sans"';
            ctx.fillStyle = COLORS.label;
            ctx.fillText(note, right, 36);
            right -= ctx.measureText(note).width + 10;
        }
        ctx.font = '22px "Chart Sans Bold"';
        ctx.fillStyle = line;
        ctx.fillText(headline, right, 36);

        ctx.font = '13px "Chart Sans"';
        ctx.fillStyle = COLORS.label;
        ctx.textAlign = 'left';
        ctx.fillText(startLabel, pad.left, height - 12);
        ctx.textAlign = 'right';
        ctx.fillText(endLabel, pad.left + plotW, height - 12);

        return image.toBuffer('image/png');
    } catch (error) {
        logger.warn('Chart rendering failed:', error.message);
        return null;
    }
}

/** 24h price chart. `prices` are in cents, oldest first (one point per 5 minutes). */
function stockChart(prices, { symbol, name }) {
    if (prices.length < 2) return null;
    const change = prices[prices.length - 1] / prices[0] - 1;
    const minutes = (prices.length - 1) * 5;
    return lineChart(prices, {
        title: symbol,
        subtitle: name,
        headline: `${formatCents(prices[prices.length - 1])}  ${change >= 0 ? '+' : ''}${(change * 100).toFixed(2)}%`,
        note: '24h',
        format: formatCents,
        startLabel: minutes >= 60 ? `${Math.round(minutes / 60)}h ago` : `${minutes}m ago`,
    });
}

/** Net worth over time, in dollars, oldest first. */
function journeyChart(values, { name, startLabel }) {
    return lineChart(values, {
        title: name,
        subtitle: 'Road to $1B',
        headline: formatCompact(values[values.length - 1]),
        note: `${((values[values.length - 1] / 1e9) * 100).toFixed(2)}% of 1B`,
        format: formatCompact,
        startLabel,
        color: COLORS.gold,
    });
}

module.exports = { available, lineChart, stockChart, journeyChart };
