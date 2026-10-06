// Careers. Each tier is a promotion: reach `shifts` worked at this job and `level` to get it.
// `words` feed the unscramble mini-game during /work.

const UNEMPLOYED = {
    id: null,
    name: 'Odd Jobs',
    emoji: '🧹',
    tiers: [{ title: 'Freelancer', pay: 90 }],
    words: ['delivery', 'babysit', 'cleaning', 'gardening', 'errand'],
};

const JOBS = {
    barista: {
        name: 'Barista',
        emoji: '☕',
        level: 1,
        description: "Pull espresso shots and remember everyone's weird orders.",
        tiers: [
            { title: 'Trainee Barista', pay: 150 },
            { title: 'Barista', pay: 210, shifts: 20, level: 4 },
            { title: 'Head Barista', pay: 300, shifts: 60, level: 8 },
        ],
        words: ['espresso', 'latte', 'cappuccino', 'croissant', 'macchiato', 'barista'],
    },
    designer: {
        name: 'Designer',
        emoji: '🎨',
        level: 5,
        description: 'Soit le meilleur designer de ta vie !',
        image: 'https://www.totaljobs.com/advice/wp-content/uploads/graphic-designer-job-description.jpg',
        tiers: [
            { title: 'Junior Designer', pay: 260 },
            { title: 'Designer', pay: 360, shifts: 25, level: 9 },
            { title: 'Art Director', pay: 520, shifts: 75, level: 14 },
        ],
        words: ['typography', 'gradient', 'kerning', 'palette', 'vector', 'mockup'],
    },
    streamer: {
        name: 'Streamer',
        emoji: '🎥',
        level: 7,
        description: 'Some days the chat is popping, some days it is just your mum.',
        volatile: true,
        tiers: [
            { title: 'Small Streamer', pay: 230 },
            { title: 'Partner', pay: 350, shifts: 25, level: 11 },
            { title: 'Influencer', pay: 540, shifts: 75, level: 16 },
        ],
        words: ['subscribe', 'emote', 'raid', 'highlight', 'donation', 'streamer'],
    },
    ingenieur: {
        name: 'Ingénieur',
        emoji: '🛠️',
        level: 10,
        description: 'Trop frais avec tes mathématiques',
        image: 'https://www.planetegrandesecoles.com/wp-content/uploads/2021/12/Salaire-ingenieur-Combien-gagne-un-ingenieur-en-France-.png',
        mathHeavy: true,
        tiers: [
            { title: 'Junior Engineer', pay: 480 },
            { title: 'Ingénieur', pay: 660, shifts: 25, level: 14 },
            { title: 'Lead Engineer', pay: 920, shifts: 75, level: 19 },
        ],
        words: ['algorithm', 'compiler', 'database', 'function', 'variable', 'integral'],
    },
    chef: {
        name: 'Chef',
        emoji: '🍳',
        level: 14,
        description: 'Yes, chef! The ratatouille will not cook itself.',
        tiers: [
            { title: 'Line Cook', pay: 640 },
            { title: 'Sous-Chef', pay: 880, shifts: 30, level: 18 },
            { title: 'Chef de Cuisine', pay: 1_250, shifts: 90, level: 23 },
        ],
        words: ['ratatouille', 'bouillabaisse', 'souffle', 'baguette', 'flambe', 'julienne'],
    },
    trader: {
        name: 'Trader',
        emoji: '📈',
        level: 18,
        description: 'Buy low, sell high, shout at screens.',
        tiers: [
            { title: 'Analyst', pay: 900 },
            { title: 'Trader', pay: 1_300, shifts: 30, level: 22 },
            { title: 'Portfolio Manager', pay: 1_850, shifts: 90, level: 27 },
        ],
        words: ['dividend', 'portfolio', 'leverage', 'volatility', 'bullish', 'hedge'],
    },
    doctor: {
        name: 'Doctor',
        emoji: '🩺',
        level: 24,
        description: 'Long nights, big paychecks, terrible handwriting.',
        tiers: [
            { title: 'Intern', pay: 1_400 },
            { title: 'Doctor', pay: 2_000, shifts: 35, level: 28 },
            { title: 'Surgeon', pay: 2_900, shifts: 100, level: 33 },
        ],
        words: ['stethoscope', 'diagnosis', 'vaccine', 'surgery', 'antibiotic', 'cardiology'],
    },
    hacker: {
        name: 'Hacker',
        emoji: '💻',
        level: 30,
        requiresItem: 'laptop',
        description: 'Ethical, of course. Needs a Laptop.',
        mathHeavy: true,
        tiers: [
            { title: 'Script Kiddie', pay: 2_200 },
            { title: 'Pentester', pay: 3_100, shifts: 35, level: 34 },
            { title: 'Zero-Day Hunter', pay: 4_400, shifts: 100, level: 39 },
        ],
        words: ['firewall', 'exploit', 'encryption', 'terminal', 'payload', 'kernel'],
    },
    ceo: {
        name: 'CEO',
        emoji: '🏢',
        level: 40,
        requiresBusinesses: 3,
        description: 'Run the show. Requires owning at least 3 businesses.',
        tiers: [
            { title: 'Founder', pay: 3_400 },
            { title: 'CEO', pay: 4_800, shifts: 40, level: 44 },
            { title: 'Mogul', pay: 7_000, shifts: 120, level: 50 },
        ],
        words: ['acquisition', 'synergy', 'shareholder', 'merger', 'keynote', 'boardroom'],
    },
    astronaut: {
        name: 'Astronaut',
        emoji: '🧑‍🚀',
        level: 50,
        description: 'The final frontier, and the final job.',
        tiers: [
            { title: 'Cadet', pay: 5_000 },
            { title: 'Astronaut', pay: 7_200, shifts: 40, level: 55 },
            { title: 'Commander', pay: 10_000, shifts: 120, level: 60 },
        ],
        words: ['orbit', 'nebula', 'gravity', 'asteroid', 'satellite', 'launchpad'],
    },
};

for (const [id, job] of Object.entries(JOBS)) job.id = id;

module.exports = { JOBS, UNEMPLOYED };
