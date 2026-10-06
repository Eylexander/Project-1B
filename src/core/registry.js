const fs = require('node:fs');
const path = require('node:path');

// Folder name -> how the category shows up in /help.
const CATEGORIES = {
    economy: { name: 'Economy', emoji: '💰', description: 'Your money, your bank, the leaderboards.' },
    work: { name: 'Work & Gathering', emoji: '⚒️', description: 'Jobs, fishing, mining and digging.' },
    items: { name: 'Items & Crafting', emoji: '🎒', description: 'Shop, inventory, chests and crafting.' },
    finance: { name: 'Finance', emoji: '📈', description: 'Stocks, businesses, the player market and the lottery.' },
    casino: { name: 'Casino', emoji: '🎰', description: 'Feeling lucky?' },
    crime: { name: 'Crime', emoji: '🦹', description: 'Robberies and heists. Crime pays... sometimes.' },
    progress: { name: 'Progression', emoji: '🏆', description: 'Quests, achievements and the road to 1B.' },
    server: { name: 'Server', emoji: '🛠️', description: 'Server settings and the global economy.' },
    utility: { name: 'Utility', emoji: '🧭', description: 'Everything that is not about money.' },
    owner: { name: 'Owner', emoji: '👑', description: 'Bot owner tools.', hidden: true },
};

const commands = new Map();
const components = new Map();

function load() {
    commands.clear();
    components.clear();
    const base = path.join(__dirname, '..', 'commands');
    for (const folder of Object.keys(CATEGORIES)) {
        const dir = path.join(base, folder);
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js') && !f.startsWith('_')).sort()) {
            const command = require(path.join(dir, file));
            if (!command.data || !command.execute) throw new Error(`commands/${folder}/${file} must export data and execute`);
            command.folder = folder;
            command.category = CATEGORIES[folder];
            if (folder === 'owner') command.ownerOnly = true;
            if (commands.has(command.data.name)) throw new Error(`Duplicate command name ${command.data.name}`);
            commands.set(command.data.name, command);
            for (const [key, handler] of Object.entries(command.components ?? {})) components.set(key, handler);
        }
    }

    const componentDir = path.join(__dirname, '..', 'components');
    if (fs.existsSync(componentDir)) {
        for (const file of fs.readdirSync(componentDir).filter((f) => f.endsWith('.js'))) {
            const mod = require(path.join(componentDir, file));
            components.set(mod.key, mod.handle);
        }
    }
    return commands;
}

/** Command JSON for Discord, split into public commands and owner-only ones. */
function definitions() {
    const all = [...commands.values()];
    return {
        public: all.filter((c) => !c.ownerOnly).map((c) => c.data.toJSON()),
        owner: all.filter((c) => c.ownerOnly).map((c) => c.data.toJSON()),
    };
}

module.exports = { load, commands, components, definitions, CATEGORIES };
