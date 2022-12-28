const { Client, Collection, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
]});
client.commands = new Collection();

module.exports.help = {
    name : "help",
    description : "Help command",
    aliases : ['h', 'halp'],
    usage : '[command | category]',
    parameters: '<command | category>'
};

module.exports.execute = async (client, message, args) => {
    if (!args[0]) {
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase());

        const createCategoriesEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTitle(client.user.username + " commands")
            .setDescription("Use `/help [command | category]` to get more information about a command or category.")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields()
            .setTimestamp()
            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

        for (const dir of categories) {
            const createCategoryName = dir.charAt(0).toUpperCase() + dir.slice(1);
            const getCategoryCommands = fs.readdirSync(`./commands/${dir}`).map(cmd => cmd.replace('.js', '')).join(', ');
            createCategoriesEmbed.addFields({ name: createCategoryName, value: getCategoryCommands, inline: true})
        }

        return message.channel.send({ embeds: [createCategoriesEmbed] })
    } else {
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase())
        const commandNames = client.commands.map(cmd => cmd.help.name)
        const searchfield = args[0].toLowerCase()

        if (commandNames.includes(searchfield)) {
            const getCommand = client.commands.get(searchfield);
            const getCommandAliases = getCommand.help.aliases.map(alias => alias).join(', ');
            const getCommandDMPermission = getCommand.data.dm_permission.toString();
            const createCommandName = searchfield.charAt(0).toUpperCase() + searchfield.slice(1);

            const getCommandEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(createCommandName + " Help")
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

            return message.channel.send({ embeds: [getCommandEmbed] })

        } else if (categories.includes(searchfield)) {
            const createCategoryName = searchfield.charAt(0).toUpperCase() + searchfield.slice(1);
            const getCategoryCommands = fs.readdirSync(`./commands/${searchfield}`).map(cmd => cmd.replace('.js', ''));

            const createCategoryEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(createCategoryName + " commands")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            for (const cmd of getCategoryCommands) {
                const getDesc = client.commands.get(cmd).help.description;
                const createCommandName = cmd.charAt(0).toUpperCase() + cmd.slice(1);
                createCategoryEmbed.addFields({ name: createCommandName, value: getDesc, inline: true})
            }

            return message.channel.send({ embeds: [createCategoryEmbed] })
        }
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option.setName('searchfield')
            .setDescription('Get help for a command or category')
            .setRequired(false))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    if (interaction.options.getString('searchfield')) {
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase())
        const commandNames = client.commands.map(cmd => cmd.help.name)
        const searchfield = interaction.options.getString('searchfield').toLowerCase()

        if (commandNames.includes(searchfield)) {
            const getCommand = client.commands.get(searchfield);
            const getCommandAliases = getCommand.help.aliases.map(alias => alias).join(', ');
            const getCommandDMPermission = getCommand.data.dm_permission.toString();
            const createCommandName = searchfield.charAt(0).toUpperCase() + searchfield.slice(1);

            const getCommandEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(createCommandName + " Help")
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

            return interaction.reply({ embeds: [getCommandEmbed] })
        } else if (categories.includes(searchfield)) {
            const createCategoryName = searchfield.charAt(0).toUpperCase() + searchfield.slice(1);
            const getCategoryCommands = fs.readdirSync(`./commands/${searchfield}`).map(cmd => cmd.replace('.js', ''));

            const createCategoryEmbed = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(createCategoryName + " commands")
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

            for (const cmd of getCategoryCommands) {
                const getDesc = client.commands.get(cmd).help.description;
                const createCommandName = cmd.charAt(0).toUpperCase() + cmd.slice(1);
                createCategoryEmbed.addFields({ name: createCommandName, value: getDesc, inline: true})
            }

            return interaction.reply({ embeds: [createCategoryEmbed] });
        } else {
            return interaction.reply({
                content: 'Invalid searchfield\nYou should use a command or category name\nUse `/help` to get a list of commands and categories',
                ephemeral: true
            })
        }
    } else {
        const categories = fs.readdirSync('./commands').map(dir => dir.toLowerCase());

        const createCategoriesEmbed = new EmbedBuilder()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTitle(client.user.username + " commands")
            .setDescription("Use `/help [command | category]` to get more information about a command or category.")
            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
            .addFields()
            .setTimestamp()
            .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

        for (const dir of categories) {
            const createCategoryName = dir.charAt(0).toUpperCase() + dir.slice(1);
            const getCategoryCommands = fs.readdirSync(`./commands/${dir}`).map(cmd => cmd.replace('.js', '')).join(', ');
            createCategoriesEmbed.addFields({ name: createCategoryName, value: getCategoryCommands, inline: true})
        }

        return interaction.reply({ embeds: [createCategoriesEmbed] })
    }
};