const chalk = require('chalk');

const Loader = require('../tools/Loader.js');

module.exports = {
    once : true,
    async execute(client, content) {
        const ssize = client.guilds.cache.size;
        const usize = eval(client.guilds.cache.map(g => g.memberCount).join(' + '));

        Loader.logToConsole(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgGreen(`ON`) + (`.`));
        Loader.logToConsole(chalk.black.bgWhite(`${ssize} Servers`) + (` - `) + chalk.black.bgWhite(`${usize} Users`) + (`.`));

        setInterval(async () => {
            await client.user.setActivity("Progress...");
            await client.user.setStatus('online');
        }, 60000);

        // Initialize mutliple systems
        Loader.logReadyToMD(ssize, usize);
        Loader.economyHandler();
        Loader.setIntervalonUpdateWords();
    }
};