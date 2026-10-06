const { makeGatherCommand, components } = require('./_gather');

module.exports = {
    ...makeGatherCommand('fish', { name: 'fish', description: 'Go fishing. Needs a Fishing Rod.', again: 'Cast again' }),
    components,
};
