const { EmbedBuilder } = require('discord.js');
const fs = require("fs")
const { admin } = require('../../settings.json')
const { logToConsole, makeName } = require('../../tools/Loader.js');

// Create the json script for the help command
module.exports.help = {
    name : "database",
    description: 'Control Databases',
    aliases : ['db'],
    usage : '< add | remove > [name]',
    parameters: ['add', 'remove']
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the admin
    if (message.author.id !== admin) return;

    // Check the inputs and do the action
    switch (args[0]) {
        case 'add':
        case 'plus':
            // Troll the user if he wants to add a database
            // (It is not possible to add a database with this command)
            message.reply({
                content: 'I can\'t add a database, you have to do it yourself!',
                allowedMentions: { repliedUser: false }
            })
            break;
        case 'remove':
        case 'del':
        case 'rem':
            // Check if the database exists and delete it
            // Technically it checks if the file exists and tries to delete it
            // In facts it is not possible to delete a database with this command
            fs.stat(`./database/${args[1]}.sqlite`, function(err, stat) {
                if(err == null) {
                    message.channel.send(`Database named ${args[1]}.sqlite existing!`)
                    try {
                        fs.unlinkSync(`./database/${args[1]}.sqlite`)
                    } catch (err) {
                        logToConsole(err)
                        message.channel.send('I can\'t delete that!')
                    }
                } else if(err.code === 'ENOENT') {
                    message.channel.send('Database not existing!')
                } else {
                    logToConsole('Some other error: ', err.code);
                    message.channel.send('I failed somewhere')
                }
            });
            break;
        case 'list':
        case 'name':            
            // Create the embed
            const createDBEmbed = new EmbedBuilder()
                .setTitle('Databases')
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic : true })});

            // Get the database files
            const databaseFolders = fs.readdirSync('./database').map(dir => dir);
            // Loop through the database folders
            for (const folder of databaseFolders) {
                // Get a list of all the database files in the folder
                const databaseFiles = fs.readdirSync(`./database/${folder}`)
                    .filter(file => file.endsWith('.sqlite'))
                    .map(cmd => cmd.replace('.sqlite', ''))
                    .join(', ');

                // Add the database files to the embed
                createDBEmbed.addFields({
                    name: `${makeName(folder)}`,
                    value: databaseFiles
                })
            }

            // Send the embed
            message.reply({
                embeds: [createDBEmbed],
                allowedMentions: { repliedUser: false }
            });

            break;
    }
};