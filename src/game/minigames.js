const rng = require('./rng');

// Quick 4-choice challenges used by /work. Each returns { prompt, options, answer }.

const EMOJI_GROUPS = [
    ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑'],
    ['🚗', '🚕', '🚙', '🚌', '🏎️', '🚓'],
    ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
    ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐'],
    ['🎸', '🎹', '🥁', '🎺', '🎻', '🪗'],
];

function unique(values, count, make) {
    const set = new Set(values);
    let guard = 0;
    while (set.size < count && guard++ < 100) set.add(make());
    return [...set];
}

function math() {
    const op = rng.pick(['+', '-', '×']);
    let a;
    let b;
    let answer;
    if (op === '×') {
        a = rng.int(3, 12);
        b = rng.int(3, 12);
        answer = a * b;
    } else if (op === '+') {
        a = rng.int(12, 99);
        b = rng.int(12, 99);
        answer = a + b;
    } else {
        a = rng.int(40, 140);
        b = rng.int(5, a - 5);
        answer = a - b;
    }
    const options = rng.shuffle(unique([answer], 4, () => Math.max(1, answer + rng.pick([-1, 1]) * rng.int(1, 12))));
    return { kind: 'math', prompt: `Quick! What is **${a} ${op} ${b}**?`, options: options.map(String), answer: options.indexOf(answer) };
}

function scramble(word) {
    let mixed = word;
    for (let i = 0; i < 10 && mixed === word; i++) mixed = rng.shuffle([...word]).join('');
    return mixed;
}

function unscramble(words) {
    const pool = [...new Set(words)];
    const word = rng.pick(pool);
    const others = rng.shuffle(pool.filter((w) => w !== word)).slice(0, 3);
    const options = rng.shuffle([word, ...others]);
    return { kind: 'unscramble', prompt: `Unscramble the word: **\`${scramble(word).toUpperCase()}\`**`, options, answer: options.indexOf(word) };
}

function oddOneOut() {
    const [main, other] = rng.shuffle(EMOJI_GROUPS);
    const odd = rng.pick(other);
    const options = rng.shuffle([...rng.shuffle(main).slice(0, 3), odd]);
    return { kind: 'odd', prompt: 'Which one **does not belong**?', options, answer: options.indexOf(odd) };
}

const FILLER_WORDS = ['schedule', 'invoice', 'meeting', 'deadline', 'printer', 'coffee', 'project', 'manager'];

/** A random challenge themed for a job. */
function forJob(job) {
    const words = [...job.words, ...FILLER_WORDS];
    const roll = rng.random();
    if (job.mathHeavy) return roll < 0.6 ? math() : unscramble(words);
    if (roll < 0.4) return unscramble(words);
    if (roll < 0.75) return math();
    return oddOneOut();
}

module.exports = { forJob, math, unscramble, oddOneOut };
