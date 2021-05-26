const chalk = require('chalk');
const moment = require('moment');
const log = message => {
  console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`);
};

module.exports = client => {
  log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgGreen(`ON`) + (`.`));
  client.user.setActivity('In Progress...',{type:'WATCHING'})
  log(chalk.white.bold(`${client.user.tag}`) + (` is working on `) + chalk.black.bgWhite(`${client.guilds.cache.size} Servers`) + (`.`));
  log(chalk.white.bold(`${client.user.tag}`) + (` has a total of `) + chalk.black.bgWhite(`${client.users.cache.size} Users`) + (`.`));
};
