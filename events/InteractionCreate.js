const { Events } = require('discord.js');

const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

	    if (!command) {
	    	console.error(`No command matching ${interaction.commandName} was found.`);
	    	return;
	    }
    
	    try {
	    	await command.run(interaction);
	    } catch (error) {
	    	console.error(error);
	    	await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	    }

		log(`${interaction.member ? interaction.member.user.tag : interaction.user.tag} : ${interaction} on [${interaction.guild === null ? "DM" : "#"+interaction.channel.name + " : " + interaction.guild.name}]`);
    }
}