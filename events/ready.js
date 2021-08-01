const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = (client) => {
  const ssize = client.guilds.cache.size;
  const usize = client.users.cache.size;
  
  log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgGreen(`ON`) + (`.`));
  client.user.setActivity('Progress...',{type:'WATCHING'})
  log(chalk.black.bgWhite(`${ssize} Servers`) + (` - `) + chalk.black.bgWhite(`${usize} Users`) + (`.`));
};