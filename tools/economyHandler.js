// Create the database Folder if not exist
const fs = require('fs');
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };

// Organize the Economy System
if (!fs.existsSync('./database/economy')) { fs.mkdirSync('./database/economy') };

// Initialize the database
const db = require('better-sqlite3');
const stats = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');

exports.onLoad = function () {
    // Mana regeneration
    setInterval(async () => {
        const users = stats.prepare("SELECT * FROM stats;").all();
    
        for (const user of users) {
        const getManaAmount = stats.prepare("SELECT mana, maxmana FROM stats WHERE id = ?;").get(user.id);
    
        if (getManaAmount.mana < getManaAmount.maxmana) {
            stats.prepare("UPDATE stats SET mana = mana + 1 WHERE id = ?;").run(user.id);
        } else {
            clearInterval(this);
        }
        }
    }, 2*60*1000);

    // Money regeneration
    setInterval(async () => {
        const users = stats.prepare("SELECT * FROM stats WHERE NOT businessID = 0;").all();
    
        for (const user of users) {
            const getUserJob = stats.prepare("SELECT businessID FROM stats WHERE id = ?;").get(user.id);
            const getJobPay = bus.prepare("SELECT salary FROM business WHERE id = ?;").get(getUserJob.businessID.toString());

            stats.prepare("UPDATE stats SET money = money + ? WHERE id = ?;").run(getJobPay.salary, user.id);
        }
    }, 3*60*60*1000);
};