const chalk = require('chalk');
const fs = require('node:fs');
const moment = require('moment');

const { logToConsole, logToDB } = require('../tools/Loader.js');

const file = (moment().format('YY-MM-DD'));

var stream = fs.createWriteStream(`logs/errors/${file}.md`, {'flags': 'a'});
stream.write(`# Session file started at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}\r\n`);
stream.write('--- \r\n\r\n');

module.exports = {
    once : false,
    execute(client, error) {
        logToConsole(chalk.red(`Error: ${error}`));
        logToDB(error);
        console.error(error)

        stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}]\r\n`);
        stream.write(`\r\n\`\`\`\r\n${error}\r\n\`\`\`\r\n\r\n`);
    }
}