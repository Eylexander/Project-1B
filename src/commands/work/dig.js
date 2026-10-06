const { makeGatherCommand } = require('./_gather');

module.exports = makeGatherCommand('dig', { name: 'dig', description: 'Dig for relics and buried treasure. Needs a Shovel.', again: 'Dig again' });
