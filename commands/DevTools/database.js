const { SlashCommandBuilder } = require('discord.js');
const fs = require("fs")
const { admin } = require('../../settings.json')
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

module.exports.help = {
    name : "database",
    description: 'Control Databases',
    aliases : ['db'],
    usage : '< add | remove > [name]',
    parameters: ['add', 'remove']
};

module.exports.execute = async (client, message, args) => {
    if (!message.author.id === admin) return;

    switch (args[0]) {
        case 'add':
        case 'plus':
            message.channel.send("U serious bro ?")
            break;
        case 'remove':
        case 'del':
        case 'rem':
            fs.stat(`./database/${args[1]}.sqlite`, function(err, stat) {
                if(err == null) {
                    message.channel.send(`Database named ${args[1]}.sqlite existing!`)
                    try {
                        fs.unlinkSync(`./database/${args[1]}.sqlite`)
                    } catch (err) {
                        log(err)
                        message.channel.send('I can\'t delete that!')
                    }
                } else if(err.code === 'ENOENT') {
                    message.channel.send('Database not existing!')
                } else {
                    log('Some other error: ', err.code);
                    message.channel.send('I failed somewhere')
                }
            });
            break;
        case 'list':
        case 'name':
            const databaseFolder = fs.readdirSync('./database');
            for (const file of databaseFolder) {
                fs.stat(`./database/${file}.sqlite`, function(err, stat) {
                    if(err == null) {
                        message.channel.send(`Database named ${file}.sqlite existing!`)
                    } else {
                        log('Some other error: ', err.code);
                        message.channel.send('I failed somewhere')
                    }
                });
            }
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a database')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Name of the database')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a database')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Name of the database')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all databases'))
    .setDMPermission(true);

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;

    switch (interaction.options.getSubcommand()) {
        case 'add':
            interaction.reply({
                content: "U serious bro ?",
                ephemeral: true
            })
            break;
        case 'remove':
            fs.stat(`./database/${interaction.options.getString('name')}.sqlite`, function(err, stat) {
                if(err == null) {
                    interaction.reply({
                        content: `Database named ${interaction.options.getString('name')}.sqlite existing!`,
                        ephemeral: true
                    })
                    try {
                        fs.unlinkSync(`./database/${interaction.options.getString('name')}.sqlite`)
                    } catch (err) {
                        log(err)
                        interaction.reply({
                            content: 'I can\'t delete that!',
                            ephemeral: true
                        })
                    }
                } else if(err.code === 'ENOENT') {
                    interaction.reply({
                        content: 'Database not existing!',
                        ephemeral: true
                    })
                } else {
                    log('Some other error: ', err.code);
                    interaction.reply({
                        content: 'I failed somewhere',
                        ephemeral: true
                    })
                }
            });
            break;
        case 'list':
            const databaseFolder = fs.readdirSync('./database');
            for (const file of databaseFolder) {
                fs.stat(`./database/${file}.sqlite`, function(err, stat) {
                    if(err == null) {
                        interaction.reply({
                            content: `Database named ${file}.sqlite existing!`,
                            ephemeral: true
                        })
                    } else {
                        log('Some other error: ', err.code);
                        interaction.reply({
                            content: 'I failed somewhere',
                            ephemeral: true
                        })
                    }
                });
            }
            break;
    }
};