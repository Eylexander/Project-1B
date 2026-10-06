const { makeGatherCommand } = require('./_gather');

module.exports = makeGatherCommand('mine', { name: 'mine', description: 'Mine for ores and gems. Needs a Pickaxe.', again: 'Swing again' });
