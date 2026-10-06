// The Discord Street exchange. Prices are in dollars here, stored in cents in the database.
// `vol` is the standard deviation of a single 5-minute tick.

const STOCKS = {
    EYLX: { name: 'Eylexander Industries', emoji: '🧪', sector: 'Tech', price: 420, vol: 0.009 },
    PTAT: { name: 'Patate Corp', emoji: '🥔', sector: 'Agriculture', price: 12.5, vol: 0.008 },
    SFRT: { name: 'Saucisse de Francfort SA', emoji: '🌭', sector: 'Food', price: 64, vol: 0.007 },
    CARP: { name: 'Carpates Mining', emoji: '⛰️', sector: 'Mining', price: 88, vol: 0.012 },
    BSUI: { name: 'Banques Suisses', emoji: '🏦', sector: 'Finance', price: 1_250, vol: 0.005 },
    ASTL: { name: 'Astley Records', emoji: '📀', sector: 'Music', price: 33, vol: 0.006 },
    MEME: { name: 'Meme Collection Inc.', emoji: '🐸', sector: 'Media', price: 6.9, vol: 0.022 },
    CANP: { name: 'Canne à Pêche & Co', emoji: '🎣', sector: 'Outdoor', price: 27, vol: 0.009 },
    DSCD: { name: 'Discord Street Holdings', emoji: '🏛️', sector: 'Conglomerate', price: 250, vol: 0.004 },
    '1BC': { name: '1B Coin', emoji: '🪙', sector: 'Crypto', price: 1, vol: 0.04 },
};

for (const [symbol, stock] of Object.entries(STOCKS)) stock.symbol = symbol;

const NEWS = {
    up: [
        '{name} smashes quarterly earnings expectations',
        'Analysts upgrade {name} to "strong buy"',
        '{name} announces a surprise partnership',
        'Rumours of a takeover send {name} soaring',
        '{name} unveils a product people actually want',
    ],
    down: [
        '{name} misses earnings, investors flee',
        'Regulators open an investigation into {name}',
        '{name} CEO spotted selling shares',
        'A data leak hits {name}',
        '{name} recalls its flagship product',
    ],
    special: {
        PTAT: { up: 'Record potato harvest: Patate Corp to the moon 🥔', down: 'Potato blight hits Patate Corp fields' },
        ASTL: { up: 'Astley Records promises to never give you up', down: 'Astley Records lets investors down' },
        BSUI: { up: 'Banques Suisses opens a new (very secret) vault', down: 'Banques Suisses accidentally publishes its client list' },
        CARP: { up: 'Carpates Mining strikes a new crystal vein', down: 'Tunnel collapse halts Carpates Mining' },
        '1BC': { up: '1B Coin listed on a major exchange 🚀', down: '1B Coin founder loses the private keys' },
        MEME: { up: 'A meme from Meme Collection Inc. goes viral', down: 'Meme Collection Inc. declared "cringe" by teenagers' },
        EYLX: { up: 'Eylexander Industries ships a long-awaited v2', down: 'Eylexander Industries delays v2 again' },
        SFRT: { up: 'Saucisse de Francfort SA wins Best Sausage award', down: 'Mustard shortage hits Saucisse de Francfort SA' },
        CANP: { up: 'Fishing season opens: Canne à Pêche & Co sells out', down: 'Canne à Pêche & Co rods snap in viral video' },
    },
};

module.exports = { STOCKS, NEWS };
