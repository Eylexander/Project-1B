const db = require('better-sqlite3');
const stats = new db('./database/economy/stats.sqlite');

exports.onLoad = function () {
    // Mana regeneration
    setInterval(async () => {
        const users = stats.prepare("SELECT * FROM stats;").all();
    
        for (const user of users) {
        const getManaAmount = stats.prepare("SELECT mana, maxmana FROM stats WHERE id = ?;").get(user.id);
    
        if (getManaAmount.mana < getManaAmount.maxmana) {
            stats.prepare("UPDATE stats SET mana = mana + 1 WHERE id = ?;").run(user.id);
            // console.log(`Mana regeneration for ${user.id}!`);
        } else {
            clearInterval(this);
        }
        }
    }, 2*60*1000);
};