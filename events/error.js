const chalk = require('chalk');
const fs = require('node:fs');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

const file = (moment().format('YY-MM-DD'));

var stream = fs.createWriteStream(`logs/errors/${file}.md`, {'flags': 'a'});
stream.write(`# Session file started at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}\r\n`);
stream.write('--- \r\n\r\n');

module.exports = (client, error) => {
    log(chalk.red(`Error: ${error}`));

    stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}]\r\n`);
    stream.write(`\r\n\`\`\`\r\n${error}\r\n\`\`\`\r\n\r\n`);
};