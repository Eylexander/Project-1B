const { ActivityType, Events } = require('discord.js');
const chalk = require('chalk');
const moment = require('moment');
const dbUtils = require('../tools/dbUtils.js');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    const ssize = client.guilds.cache.size;
    const usize = eval(client.guilds.cache.map(g => g.memberCount).join(' + '));
    
    log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgGreen(`ON`) + (`.`));
    client.user.setActivity('In Progress...', { type: ActivityType.Watching });
    client.user.setStatus('dnd');
    log(chalk.black.bgWhite(`${ssize} Servers`) + (` - `) + chalk.black.bgWhite(`${usize} Users`) + (`.`));

    dbUtils.initDatabases();
  }
}

// module.exports.ssize;
// module.exports.usize;