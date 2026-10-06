const { GameError } = require('../core/errors');

const SUFFIXES = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

/**
 * Turns what a player typed into a whole number.
 * Accepts 1500, 1,500, 1.5k, 2m, 50%, half, all/max.
 * `available` is what "all", "half" and percentages are relative to.
 */
function parseAmount(input, { available = 0, min = 1, label = 'amount' } = {}) {
    const raw = String(input ?? '').trim().toLowerCase().replace(/[,_\s$]/g, '');
    if (!raw) throw new GameError(`Please give an ${label}.`);

    let value;
    if (raw === 'all' || raw === 'max') {
        value = available;
    } else if (raw === 'half') {
        value = Math.floor(available / 2);
    } else if (/^\d+(\.\d+)?%$/.test(raw)) {
        const percent = Math.min(parseFloat(raw), 100);
        value = Math.floor((available * percent) / 100);
    } else {
        const match = raw.match(/^(\d+(?:\.\d+)?)([kmbt])?$/);
        if (!match) throw new GameError(`\`${input}\` is not a valid ${label}. Try \`2500\`, \`10k\`, \`half\` or \`all\`.`);
        value = Math.floor(parseFloat(match[1]) * (SUFFIXES[match[2]] ?? 1));
    }

    if (!Number.isSafeInteger(value)) throw new GameError(`That ${label} is way too big.`);
    if (value < min) {
        throw new GameError(
            available <= 0 && /^(all|max|half|\d+(\.\d+)?%)$/.test(raw)
                ? `You don't have anything to use for that ${label}.`
                : `The ${label} must be at least ${min.toLocaleString('en-US')}.`,
        );
    }
    return value;
}

module.exports = { parseAmount };
