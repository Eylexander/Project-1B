const dbUtils = require('../tools/dbUtils.js');
const chalk = require('chalk');
const fs = require('node:fs');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = async (client) => {
    const ssize = client.guilds.cache.size;
    const usize = eval(client.guilds.cache.map(g => g.memberCount).join(' + '));
    
    log(chalk.white.bold(`${client.user.tag}`) + (` is `) + chalk.black.bgGreen(`ON`) + (`.`));

    // setInterval(async () => {
    //     await client.user.setActivity("Progress...", { type: 'WATCHING' });
    //     await client.user.setStatus('online');
    // }, 1000);

    log(chalk.black.bgWhite(`${ssize} Servers`) + (` - `) + chalk.black.bgWhite(`${usize} Users`) + (`.`));
    
    // Defining Files
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
if (!fs.existsSync('./logs/errors')) { fs.mkdirSync('./logs/errors') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
if (!fs.existsSync(folder)) { fs.mkdirSync(folder) };

    // Creating the writer
var stream = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'w'});
stream.write(`# Session file started at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}\r\n`);
stream.write(`## [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Client is ON | ${ssize} Servers | ${usize} Users \r\n`);
stream.write('--- \r\n');

    dbUtils.initDatabases();
};