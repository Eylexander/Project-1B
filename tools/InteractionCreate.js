const fs = require('node:fs');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

// Reading the database files for the ban system
const db = require("better-sqlite3");
if (!fs.existsSync('./database')) { fs.mkdirSync('./database') };
if (!fs.existsSync('./database/devtools')) { fs.mkdirSync('./database/devtools') };
const ban = new db('./database/devtools/bannedusers.sqlite');

// Creating the writer
if (!fs.existsSync('./logs')) { fs.mkdirSync('./logs') };
if (!fs.existsSync('./logs/errors')) { fs.mkdirSync('./logs/errors') };
const file = (moment().format('YY-MM-DD HH') + ('h') + moment().format('mm'));
const folder = './logs/' + (moment().format('YYYY-MM-DD'));
var stream = fs.createWriteStream(`${folder}/${file}.md`, {'flags': 'a'});
if (!fs.existsSync(folder)) { fs.mkdirSync(folder) };

exports.onInteraction = function(client, interaction) {
	if (!interaction.isChatInputCommand()) return;

	stream.write(`### [${moment().format('YYYY-MM-DD HH:mm:ss.SSS')}] User ${interaction.member?.user.username ?? interaction.user.username} (${interaction.member?.user.id ?? interaction.user.id}) used interaction:
${interaction.guild === null ? `in DM (${interaction.user.id})` : "on [#" + interaction.channel.name + " ("+interaction.channel.id+") : " + interaction.guild.name + " ("+interaction.guild.id+")]"}\r\n`);
    stream.write(`\r\n\`\`\`\r\n${interaction}\r\n\`\`\`\r\n`);

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		// Check if the user is banned
		const getBanned = ban.prepare("SELECT * FROM bannedusers WHERE id = ?").get(interaction.member?.user.id ?? interaction.user.id);
		if (getBanned) {
			interaction.reply({ content: `You are banned from using this bot. Reason: ${getBanned.reason}`, ephemeral: true });
			return;
		}

		command.run(client, interaction);
	}
	catch (error) {
		console.error(error);
		interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}

	log(`${interaction.member?.user.tag ?? interaction.user.tag} : ${interaction} on [${interaction.guild === null ? "DM" : "#"+interaction.channel.name + " : " + interaction.guild.name}]`);
};