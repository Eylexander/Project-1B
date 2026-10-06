const guilds = require('../game/guilds');
const logger = require('./logger');
const { payload } = require('../ui/card');

/** Posts a card in every server that set an announcement channel with /config. */
async function announce(client, card) {
    let sent = 0;
    for (const { announce_channel_id: channelId } of guilds.announceChannels()) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel?.isTextBased()) {
                await channel.send(payload(card));
                sent++;
            }
        } catch (error) {
            logger.warn(`Announcement to ${channelId} failed: ${error.message}`);
        }
    }
    return sent;
}

module.exports = { announce };
