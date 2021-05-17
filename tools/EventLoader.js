const reqEvent = (event) => require(`../events/${event}`)

module.exports = client => {
  client.on('ready', () => reqEvent('ready')(client));
  client.on('disconnected', () => reqEvent('disconnected')(client));
  client.on('reconnecting', () => reqEvent('reconnecting')(client));
};