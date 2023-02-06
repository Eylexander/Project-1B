const { KeyObject } = require('crypto');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
]});
client.commands = new Collection();

// Create the json script for the help command
module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command | category]',
    parameters: '<command | category>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    
    // Creation of a function to capitalize the first letter of a string
    const makeName = (name) => name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);
    // Get a list of all the categories
    const getCategories = fs.readdirSync('./commands').map(dir => dir);

    // Create the basic embed
    const createBasicHelper = new EmbedBuilder()
        .setColor(Math.floor(Math.random() * 16777214) + 1)
        .setTitle(client.user.username + " commands")
        .setDescription("Use `/help [command | category]` to get more information about a command or category.")
        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
        .addFields()
        .setTimestamp()
        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

    // Add all the categories to the embed
    for (const dir of getCategories) {
        // Ignore the hidden folders
        if (dir === 'DevTools') continue;

        // Get a list of all the commands in the category
        const getCategoryCommands = fs.readdirSync(`./commands/${dir}`).map(cmd => cmd.replace('.js', '')).join(', ');

        // Add the category to the embed
        createBasicHelper.addFields({ name: makeName(dir), value: getCategoryCommands, inline: true})
    }

    if (!args[0]) {

        // Return the embed if no argument is provided
        return message.reply({
            embeds: [createBasicHelper],
            allowedMentions: { repliedUser: false }
        })

    } else {

        // Get the argument and make it lowercase
        const searchfield = args[0].toLowerCase()
        // Get a list of all the command categories
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase())
        // Get a list of all the commands from the client collection
        const commandNames = client.commands.map(cmd => cmd.help.name);
        
        // Create a function to get every command with there aliases
        const getGlobalCommandAliases = client.commands.reduce((acc, cmd) => {
            acc[cmd.help.name] = cmd.help.aliases;
            return acc;
        }, {});

        let commandNameAlias = null;
        for (const alias in getGlobalCommandAliases) {
            if (getGlobalCommandAliases[alias].includes(args[0])) {
                commandNameAlias = alias;
                break;
            }
        }

        // Check if the argument is a command or a category
        if (commandNames.includes(searchfield) || commandNameAlias !== null) {
            // Get the command from the client collection
            const getCommand = client.commands?.get(commandNameAlias) ?? client.commands.get(searchfield);
            // Get the aliases of the command
            const getCommandAliases = getCommand.help.aliases.map(alias => alias).join(', ');
            // Get the dm permission of the command
            const getCommandDMPermission = getCommand.data?.dm_permission.toString() ?? 'None';

            // Create the embed
            const getCommandEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(makeName(getCommand.help.name) + " Help")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'Name', value: getCommand.help.name, inline: true },
                    { name: 'Aliases', value: getCommandAliases, inline: true },
                    { name: 'Description', value: getCommand.help.description, inline: false},
                    { name: 'Usage', value: getCommand.help.usage, inline: true},
                    { name: 'Parameters', value: getCommand.help.parameters, inline: true},
                    { name: 'DM Permission', value: getCommandDMPermission, inline: true},
                )
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            // Return the embed if the argument is a command
            return message.channel.send({ embeds: [getCommandEmbed] });

        // Check if the argument is a category
        } else if (categories.includes(searchfield)) {

            // Get a list of all the commands in the category
            const getCategoryCommands = fs.readdirSync(`./commands/${searchfield}`).map(cmd => cmd.replace('.js', ''));

            // Create the embed
            const createCategoryEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(makeName(searchfield) + " commands")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            // Add all the commands in the category to the embed
            for (const cmd of getCategoryCommands) {
                // Get the description of the command
                const getDesc = client.commands.get(cmd).help.description;
                // Add the command to the embed
                createCategoryEmbed.addFields({ name: makeName(cmd), value: getDesc, inline: true})
            }

            // Return the embed if the argument is a category
            return message.channel.send({ embeds: [createCategoryEmbed] })

        } else {

            // Return the basic embed if the argument is not a command or a category
            return message.channel.send({ embeds: [createBasicHelper] })

        }
    }
};

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option.setName('searchfield')
            .setDescription('Get help for a command or category')
            .setRequired(false))
    .setDMPermission(true)

// Create the run script for the interaction command
module.exports.run = async (client, interaction) => {

    // Creation of a function to capitalize the first letter of a string
    const makeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);
    // Check if the searchfield option is provided
    if (interaction.options.getString('searchfield')) {

        // Get a list of all the command categories
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase())
        // Get a list of all the commands from the client collection
        const commandNames = client.commands.map(cmd => cmd.help.name)
        // Get the argument and make it lowercase
        const searchfield = interaction.options.getString('searchfield').toLowerCase()

        // Create a function to get every command with there aliases
        const getGlobalCommandAliases = client.commands.reduce((acc, cmd) => {
            acc[cmd.help.name] = cmd.help.aliases;
            return acc;
        }, {});

        let commandNameAlias = null;
        for (const alias in getGlobalCommandAliases) {
            if (getGlobalCommandAliases[alias].includes(args[0])) {
                commandNameAlias = alias;
                break;
            }
        }

        // Check if the argument is a command
        if (commandNames.includes(searchfield) || commandNameAlias !== null) {

            // Get the command from the client collection
            const getCommand = client.commands?.get(commandNameAlias) ?? client.commands.get(searchfield);
            // Get the aliases of the command
            const getCommandAliases = getCommand.help.aliases.map(alias => alias).join(', ');
            // Get the dm permission of the command
            const getCommandDMPermission = getCommand.data.dm_permission.toString();

            // Create the embed
            const getCommandEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(makeName(getCommand.help.name) + " Help")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: 'Name', value: getCommand.help.name, inline: true },
                    { name: 'Aliases', value: getCommandAliases, inline: true },
                    { name: 'Description', value: getCommand.help.description, inline: false},
                    { name: 'Usage', value: getCommand.help.usage, inline: true},
                    { name: 'Parameters', value: getCommand.help.parameters, inline: true},
                    { name: 'DM Permission', value: getCommandDMPermission, inline: true},
                )
                .setTimestamp()
                .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

            // Return the embed if the argument is a command
            return interaction.reply({ embeds: [getCommandEmbed] })

        // Check if the argument is a category
        } else if (categories.includes(searchfield)) {

            // Get a list of all the commands in the category
            const getCategoryCommands = fs.readdirSync(`./commands/${searchfield}`).map(cmd => cmd.replace('.js', ''));

            // Create the embed
            const createCategoryEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(makeName(searchfield) + " commands")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

            // Add all the commands in the category to the embed
            for (const cmd of getCategoryCommands) {
                // Get the description of the command
                const getDesc = client.commands.get(cmd).help.description;
                // Add the command to the embed
                createCategoryEmbed.addFields({ name: makeName(cmd), value: getDesc, inline: true})
            }

            // Return the embed if the argument is a category
            return interaction.reply({ embeds: [createCategoryEmbed] });

        } else {

            // Return the basic embed if the argument is not a command or a category
            return interaction.reply({
                content: 'Invalid searchfield\nYou should use a command or category name\nUse `/help` to get a list of commands and categories',
                ephemeral: true
            });

        }

    } else {

        // Get a list of all the command categories
        const categories = fs.readdirSync('./commands').map(dir => dir);

        // Create the basic embed
        const createCategoriesEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTitle(client.user.username + " commands")
            .setDescription("Use `/help [command | category]` to get more information about a command or category.")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields()
            .setTimestamp()
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

        // Add all the categories to the embed
        for (const dir of categories) {
            // Ignore the hidden folders
            if (dir === 'DevTools') continue;

            // Get a list of all the commands in the category
            const getCategoryCommands = fs.readdirSync(`./commands/${dir}`).map(cmd => cmd.replace('.js', '')).join(', ');
            // Add the category to the embed
            createCategoriesEmbed.addFields({ name: makeName(dir), value: getCategoryCommands, inline: true})
        }

        // Return the basic embed if the searchfield option is not provided
        return interaction.reply({ embeds: [createCategoriesEmbed] })
    }
};