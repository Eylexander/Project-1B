/** An error the player caused (not enough money, on cooldown...). Shown to them as-is. */
class GameError extends Error {
    constructor(message, { title = 'Hold on', emoji = '⚠️' } = {}) {
        super(message);
        this.name = 'GameError';
        this.title = title;
        this.emoji = emoji;
    }
}

module.exports = { GameError };
