const { ActivityType, Events } = require('discord.js');
const chalk = require('chalk');
const moment = require('moment');
const dbUtils = require('../tools/dbUtils.js');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

const db = require("better-sqlite3");
const stats = new db('./database/stats.sqlite');

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

    const interval = setInterval(async () => {
      const users = stats.prepare("SELECT * FROM stats;").all();

      for (const user of users) {
        const getManaAmount = stats.prepare("SELECT mana, maxmana FROM stats WHERE id = ?;").get(user.id);

        if (getManaAmount.mana <= getManaAmount.maxmana) {
          stats.prepare("UPDATE stats SET mana = mana + 1 WHERE id = ?;").run(user.id);
        } else {
          clearInterval(interval);
        }
      }
    }, 60000);
  }
}