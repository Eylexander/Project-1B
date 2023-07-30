const fs = require('fs');
const moment = require('moment');
const db = require("better-sqlite3");

let streamChannel;
let errorsDB;
let bansDB;

// Define the constant of embed random color
const randomColor = () => Math.floor(Math.random() * 16777214) + 1;

// Create the logging in response to the ready event
function logReadyToMD (ssize, usize) {

    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
        fs.mkdirSync('./logs/errors')
    }

    const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
    const folder = './logs/' + (moment().format('YYYY-MM-DD'));

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder)
    };

    streamChannel = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'a'});
    streamChannel.write(`# Session file started at ${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}\r\n`);
    streamChannel.write(`## [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] Client is ON | ${ssize} Servers | ${usize} Users \r\n`);
    streamChannel.write('--- \r\n');
}

// Return the streamChannel
function getStreamMD () {
    return streamChannel;
}

// Create a global function to make the first letter of a string uppercase
function makeName (name) {
    return name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);
}

// Create a global function to log to console
function logToConsole (message) {
    console.log('[' + moment().format('MM-DD HH:mm:ss.SSS') + '] ' + message);
}

// Create a global function to log to file
function logToMD (message, interaction) {

    let stream = getStreamMD();

    if (interaction) {
        stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] User ${interaction.member?.user.username ?? interaction.user.username} (${interaction.member?.user.id ?? interaction.user.id}) used interaction:
${interaction.guild === null ? `in DM (${interaction.user.id})` : "on [#" + interaction.channel.name + " ("+interaction.channel.id+") : " + interaction.guild.name + " ("+interaction.guild.id+")]"}\r\n`)
        
        stream.write(`\r\n\`\`\`\r\n${interaction}\r\n\`\`\`\r\n`);

    } else if (message) {
        stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] User ${message.author.username} (${message.author.id}) posted:
${message.guild === null ? `in DM (${message.author.id})` : "on [#" + message.channel.name + " ("+message.channel.id+") : " + message.guild.name + " ("+message.guild.id+")]"}\r\n`);
        
        stream.write(`\r\n\`\`\`\r\n${message.attachments.size > 0 ? `Attachment of type : ${message.attachments.toJSON()[0].contentType}` : message.content}\r\n\`\`\`\r\n`);

    } else {
        logToConsole(`Error while logging to file: No message or interaction provided`);
        return;
    }
}

// Create everything we need for the databases
function initDatabases () {

    const economyPath = './database/economy';
    const devtoolsPath = './database/devtools';

    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database');
        fs.mkdirSync(economyPath);
        fs.mkdirSync(devtoolsPath);
    }
    
    // Define the database for the economy system
    const inventoryDB = new db(economyPath + '/inventory.sqlite');
    const businessDB = new db(economyPath + '/business.sqlite');
    const itemsListDB = new db(economyPath + '/items.sqlite');
    const userInventoryItemsDB = new db(economyPath + '/useritems.sqlite');
    const treasureListDB = new db(economyPath + '/treasure.sqlite');
    
    // Define the database for the devtools
    const suggestionsDB = new db(devtoolsPath + '/suggestions.sqlite');
    bansDB = new db(devtoolsPath + '/banList.sqlite');
    const serverListDB = new db(devtoolsPath + '/serverList.sqlite');
    const wordsDB = new db(devtoolsPath + '/words.sqlite');
    const logsDB = new db(devtoolsPath + '/logs.sqlite');
    errorsDB = new db(devtoolsPath + '/errors.sqlite');


    // First, define the economy databases

    // Define the inventory.sqlite
    const inventory = inventoryDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'inventory';").get();
    if (!inventory['count(*)']) {
        inventoryDB.prepare(`
            CREATE TABLE inventory (
                id INTEGER PRIMARY KEY,
                user TEXT,
                money INTEGER,
                xp INTEGER,
                level INTEGER,
                mana INTEGER,
                maxmana INTEGER,
                businessID INTEGER
            );
        `).run();
        inventoryDB.prepare("CREATE UNIQUE INDEX idx_inventory_id ON inventory (id);").run();
        inventoryDB.pragma("asynchronous = 1");
        inventoryDB.pragma("journal_mode = wal");
    }

    // Define the business.sqlite
    const business = businessDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'business';").get();
    if (!business['count(*)']) {
        businessDB.prepare(`
            CREATE TABLE business (
                id INTEGER PRIMARY KEY,
                businessName TEXT,
                salary INTEGER,
                levelRequired INTEGER,
                description TEXT,
                imageURL TEXT
            );
        `).run();
        businessDB.prepare("CREATE UNIQUE INDEX idx_business_id ON business (id);").run();
        businessDB.pragma("asynchronous = 1");
        businessDB.pragma("journal_mode = wal");
    }

    // Define the items.sqlite
    const items = itemsListDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'itemslist';").get();
    if (!items['count(*)']) {
        itemsListDB.prepare(`
            CREATE TABLE itemslist (
                id TEXT PRIMARY KEY,
                itemName TEXT,
                value INTEGER,
                effects INTEGER,
                rarity TEXT
            );
        `).run();
        itemsListDB.prepare("CREATE UNIQUE INDEX idx_items_id ON itemslist (id);").run();
        itemsListDB.pragma("asynchronous = 1");
        itemsListDB.pragma("journal_mode = wal");
    }

    // Define the useritems.sqlite
    const useritems = userInventoryItemsDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'inventoryitems';").get();
    if (!useritems['count(*)']) {
        userInventoryItemsDB.prepare(`
            CREATE TABLE inventoryitems (
                userID TEXT,
                itemid INTEGER,
                amount INTEGER
            );
        `).run();
        userInventoryItemsDB.pragma("asynchronous = 1");
        userInventoryItemsDB.pragma("journal_mode = wal");
    }

    // Define the treasure.sqlite
    const treasure = treasureListDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'treasurelist';").get();
    if (!treasure['count(*)']) {
        treasureListDB.prepare(`
            CREATE TABLE treasurelist (
                id TEXT PRIMARY KEY,
                timestamp INTEGER,
                collectedBy INTEGER
            );
        `).run();	
        treasureListDB.prepare("CREATE UNIQUE INDEX idx_treasure_id ON treasurelist (id);").run();
        treasureListDB.pragma("asynchronous = 1");
        treasureListDB.pragma("journal_mode = wal");
    }


    // Second, define the devtools databases

    // Define the suggestions.sqlite
    const suggestions = suggestionsDB.prepare("SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'suggestions';").get();
    if (!suggestions['count(*)']) {
        suggestionsDB.prepare(`
            CREATE TABLE suggestions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userID INTEGER,
                user TEXT,
                name TEXT,
                suggestions TEXT
            );
        `).run();
        suggestionsDB.prepare("CREATE UNIQUE INDEX idx_suggestions_id ON suggestions (id);").run();
        suggestionsDB.pragma("asynchronous = 1");
        suggestionsDB.pragma("journal_mode = wal");
    }

    // Define the banList.sqlite
    const banList = bansDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'banlist';").get();
    if (!banList['count(*)']) {
        bansDB.prepare(`
            CREATE TABLE banlist (
                id TEXT PRIMARY KEY,
                user TEXT,
                reason TEXT
            );
        `).run();
        bansDB.prepare("CREATE UNIQUE INDEX idx_blocked_id ON banlist (id);").run();
        bansDB.pragma("asynchronous = 1");
        bansDB.pragma("journal_mode = wal");
    }

    // Define the serverList.sqlite
    const serverList = serverListDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'serverlist';").get();
    if (!serverList['count(*)']) {
        serverListDB.prepare(`
            CREATE TABLE serverlist (
                id TEXT PRIMARY KEY,
                server TEXT,
                prefix TEXT,
                language TEXT
            );
        `).run();
        serverListDB.prepare("CREATE UNIQUE INDEX idx_server_id ON serverlist (id);").run();
        serverListDB.pragma("asynchronous = 1");
        serverListDB.pragma("journal_mode = wal");
    }

    // Define the words.sqlite
    const words = wordsDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'words';").get();
    if (!words['count(*)']) {
        wordsDB.prepare(`
            CREATE TABLE words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                word TEXT
            );
        `).run();
        wordsDB.prepare("CREATE UNIQUE INDEX idx_words_id ON words (id);").run();
        wordsDB.pragma("asynchronous = 1");
        wordsDB.pragma("journal_mode = wal");
    }

    // Define the logs.sqlite
    const logs = logsDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'logs';").get();
    if (!logs['count(*)']) {
        logsDB.prepare(`
            CREATE TABLE logs (
                timestamp INTEGER,
                messageID INTEGER,
                channelID INTEGER,
                guildID INTEGER,
                authorID INTEGER,
                authorName TEXT,
                content TEXT,
                attachmentURL TEXT,
                attachmentType TEXT,
                PRIMARY KEY (timestamp, messageID)
            );
        `).run();
        logsDB.prepare("CREATE UNIQUE INDEX idx_logs_id ON logs (timestamp, messageID);").run();
        logsDB.pragma("asynchronous = 1");
        logsDB.pragma("journal_mode = wal");
    }

    // Define the errors.sqlite
    const errors = errorsDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'errors';").get();
    if (!errors['count(*)']) {
        errorsDB.prepare(`
            CREATE TABLE errors (
                timestamp INTEGER,
                errorMessage TEXT,
                PRIMARY KEY (timestamp, errorMessage)
            )
        `).run();
        errorsDB.prepare("CREATE UNIQUE INDEX idx_errors_id ON errors (timestamp, errorMessage);").run();
        errorsDB.pragma("asynchronous = 1");
        errorsDB.pragma("journal_mode = wal");
    }
}

// Create a global function to log to database the errors
function logToDB (error) {
    errorsDB.prepare(`
        INSERT OR REPLACE INTO errors VALUES (
            @timestamp,
            @errorMessage);
        `).run({
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
            errorMessage: error.toString()
        });
}

// Create the economy handler
function economyHandler () {

    let playersList = inventory.prepare("SELECT * FROM inventory;").all();

    // Create the mana regeneration
    setInterval(async () => {
    
        for (const player of playersList) {
            let getManaAmount = inventory
                .prepare("SELECT mana, maxmana FROM inventory WHERE id = ?;")
                .get(player.id);
    
            if (getManaAmount.mana < getManaAmount.maxmana) {
                inventory
                    .prepare("UPDATE inventory SET mana = mana + 1 WHERE id = ?;")
                    .run(player.id);

            } else clearInterval(this);
        }
    }, 2*60*1000);

    // Create the salary paiment
    setInterval(async () => {

        for (const player of playersList) {

            if (player.businessID === 0) continue;

            let getJobPay = business
                .prepare("SELECT salary FROM business WHERE id = ?;")
                .get(player.businessID);

            inventory
                .prepare("UPDATE inventory SET money = money + ? WHERE id = ?;")
                .run(getJobPay.salary, player.id);
        }
    }, 3*60*60*1000);
}

// Create the interaction handler
function onInteraction (client, interaction) {
    // Check if the interaction is a command
	if (!interaction.isChatInputCommand()) return;

    // Create the writer
    logToMD(null, interaction);

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
        logToDB(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		// Check if the user is banned
		const getBanned = bansDB.prepare("SELECT * FROM banlist WHERE id = ?").get(interaction.member?.user.id ?? interaction.user.id);
		if (getBanned) {
			interaction.reply({ content: `You are banned from using this bot. Reason: ${getBanned.reason}`, ephemeral: true });
			return;
		}

		command.run(client, interaction);
	}
	catch (error) {
		console.error(error);
        logToDB(error);
		interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}

	logToConsole(`${interaction.member?.user.tag ?? interaction.user.tag} : ${interaction} on [${interaction.guild === null ? "DM" : "#"+interaction.channel.name + " : " + interaction.guild.name}]`);
};

module.exports = {
    randomColor,
    logReadyToMD,
    getStreamMD,
    makeName,
    logToConsole,
    logToMD,
    logToDB,
    initDatabases,
    economyHandler,
    onInteraction
}