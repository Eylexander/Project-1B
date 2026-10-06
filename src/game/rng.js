const crypto = require('node:crypto');

// Everything random goes through rng.random() so tests can swap it for a fixed sequence.
const rng = {
    random() {
        return crypto.randomInt(0, 2 ** 47) / 2 ** 47;
    },

    /** Integer in [min, max], both inclusive. */
    int(min, max) {
        return min + Math.floor(rng.random() * (max - min + 1));
    },

    float(min, max) {
        return min + rng.random() * (max - min);
    },

    chance(probability) {
        return rng.random() < probability;
    },

    pick(list) {
        return list[Math.floor(rng.random() * list.length)];
    },

    /** Picks one entry, `weightOf(entry)` gives its weight. */
    weighted(entries, weightOf = (entry) => entry[1]) {
        const total = entries.reduce((sum, entry) => sum + weightOf(entry), 0);
        let roll = rng.random() * total;
        for (const entry of entries) {
            roll -= weightOf(entry);
            if (roll < 0) return entry;
        }
        return entries[entries.length - 1];
    },

    /** Standard normal sample (Box-Muller). */
    gaussian() {
        const u = 1 - rng.random();
        const v = rng.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },

    shuffle(list) {
        const copy = [...list];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(rng.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    },
};

module.exports = rng;
