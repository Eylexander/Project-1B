const chalk = require('chalk');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = client => {
    log(chalk.black.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgRed(`OFF`) + (`.`));
};
