const fs = require('node:fs');
const path = require('node:path');
const chalk = require('chalk');
const config = require('../config');

let stream = null;
let streamDay = null;

function stamp(date = new Date()) {
    return date.toISOString().replace('T', ' ').slice(0, 23);
}

// One plain-text file per day: logs/YYYY-MM-DD/bot.log
function fileStream() {
    if (process.env.P1B_NO_FILE_LOGS) return null;
    const day = new Date().toISOString().slice(0, 10);
    if (stream && streamDay === day) return stream;
    if (stream) stream.end();
    const dir = path.join(config.logsDir, day);
    fs.mkdirSync(dir, { recursive: true });
    stream = fs.createWriteStream(path.join(dir, 'bot.log'), { flags: 'a' });
    streamDay = day;
    return stream;
}

function write(level, color, parts) {
    const text = parts
        .map((p) => (p instanceof Error ? p.stack || p.message : typeof p === 'string' ? p : JSON.stringify(p)))
        .join(' ');
    const time = stamp();
    if (!process.env.P1B_QUIET) {
        console.log(chalk.grey(`[${time}]`), color(level.padEnd(5)), text);
    }
    fileStream()?.write(`[${time}] ${level.padEnd(5)} ${text}\n`);
}

module.exports = {
    info: (...parts) => write('INFO', chalk.cyan, parts),
    ok: (...parts) => write('OK', chalk.green, parts),
    warn: (...parts) => write('WARN', chalk.yellow, parts),
    error: (...parts) => write('ERROR', chalk.red, parts),
    cmd: (...parts) => write('CMD', chalk.magenta, parts),
};
