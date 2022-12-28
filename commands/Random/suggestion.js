const { prefix, admin } = require('../../settings.json');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const db = require("better-sqlite3");
const sent = new db('./database/infos.sqlite');

module.exports.help = {
    name: "suggestion",
    description: "Add a suggestion to the todo list!",
    aliases: ['suggest', 'sugg'],
    usage: "[parameter] [name] [description]",
    parameters: ['add', 'new', 'create', 'remove', 'del', 'rem']
};

module.exports.execute = async (client, message, args) => {
    const getUserSuggestionbyId = sent.prepare("SELECT * FROM infos WHERE id = ?;");
    const addSuggestion = sent.prepare("INSERT INTO infos (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);");
    const getSuggestionsAll = sent.prepare("SELECT id, user, name, suggestions FROM infos;").all();

    switch (args[0]) {
        case 'add':
        case 'new':
        case 'create':
            addSuggestion.run({
                id: message.author.id,
                user: message.author.username,
                name: args[1],
                suggestions: args.slice(2).join(" ")
            });
            message.reply({
                content: "Your suggestion has been added !",
                allowedMentions: { repliedUser: false }
            });
            break;
        case 'remove':
        case 'del':
        case 'rem':
            if (!message.author.id === admin) return;
            if (!args[1]) {
                if (getUserSuggestionbyId.get(message.author.id)) {
                    sent.prepare(`DELETE FROM infos WHERE id = ${message.author.id};`).run();
                    message.channel.send(`User ${message.author.username} (${message.author.id}) suggestion deleted !`);
                }
            } else if (message.mentions.users.first()) {
                const getMentionTag = message.mentions.users.first()

                if (getUserSuggestionbyId.get(getMentionTag.id)) {
                    sent.prepare(`DELETE FROM infos WHERE id = ${getMentionTag.id};`).run();
                    message.channel.send(`User ${getMentionTag.username} (${getMentionTag.id}) suggestion deleted !`);
                }
            } else {
                if (args[1].match(/([0-9]*)/)) {
                    const getMentionId = args[1].match(/([0-9]*)/);
                    const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1]);

                    if (!getUserObjectId) return message.channel.send('This user never sent any suggestions!')

                    sent.prepare(`DELETE FROM infos WHERE id = ${getUserObjectId.id};`).run();
                    return message.channel.send(`User ${getUserObjectId.user} (${getUserObjectId.id}) suggestion deleted !`);
                }
            }
            break;
        case 'get':
        case 'see':
        case 'list':
            switch (args[1]) {
                case 'all':
                case 'everyone':
                case 'allusers':
                    if (!message.author.id === admin) return;

                    const getEveryoneEmbed = new EmbedBuilder()
                        .setTitle('All users suggestions')
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        // .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                        .setDescription(`I found ${getSuggestionsAll.length} suggestion(s) :`)
                        .addFields()
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                    for (const data of getSuggestionsAll) {
                        getEveryoneEmbed.addFields({name: `${data.user} (${data.id})`, value:`${data.name}: ${data.suggestions}`, inline: false})
                    }

                    message.channel.send({ embeds: [getEveryoneEmbed] });
                    break;
                case null || undefined:

                    const getIndividualEmbed = new EmbedBuilder()
                        .setTitle('Your suggestions')
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        // .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                        .setDescription(`You have ${getUserSuggestionbyId.all(message.author.id).length} suggestion(s) :`)
                        .addFields()
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                    for (const data of getUserSuggestionbyId.all(message.author.id)) {
                        getIndividualEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                    }

                    message.channel.send({ embeds: [getIndividualEmbed] });
                    break;
                default:
                    if (!message.author.id === admin) return;
                    if (message.mentions.users.first()) {
                        const getMentionTag = message.mentions.users.first();

                        const getUserTagEmbed = new EmbedBuilder()
                            .setTitle(`${getMentionTag.username}'s suggestions`)
                            .setColor(Math.floor(Math.random() * 16777214) + 1)
                            // .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                            .setDescription(`User ${getMentionTag.username} (${getMentionTag.id}) has ${getUserSuggestionbyId.all(getMentionTag.id).length} suggestion(s) :`)
                            .addFields()
                            .setTimestamp()
                            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    
                        for (const data of getUserSuggestionbyId.all(getMentionTag.id)) {
                            getUserTagEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                        }

                        message.channel.send({ embeds: [getUserTagEmbed] });
                    } else {
                        if (args[1].match(/([0-9]*)/)) {
                            const getMentionId = args[1].match(/([0-9]*)/)
                            const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1])
                            
                            if (!getUserObjectId) return message.channel.send('This user never sent any suggestions!')

                            const getUserIdEmbed = new EmbedBuilder()
                                .setTitle(`${getUserObjectId.username}'s suggestions`)
                                .setColor(Math.floor(Math.random() * 16777214) + 1)
                                // .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                                .setDescription(`User ${getUserObjectId.user} (${getUserObjectId.id}) has ${getUserSuggestionbyId.all(getUserObjectId.id).length} suggestion(s) :`)
                                .addFields()
                                .setTimestamp()
                                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                            for (const data of getUserSuggestionbyId.all(getUserObjectId.id)) {
                                getUserIdEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                            }

                            message.channel.send({ embeds: [getUserIdEmbed] });
                        }
                    }
                    break;
            }
            break;
        default:
            message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
            break;
    }
};

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a suggestion to the todo list!')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Name of the suggestion')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('description')
                    .setDescription('Description of the suggestion')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a suggestion from the todo list!')
            .addStringOption(option =>
                option.setName('id')
                    .setDescription('Delete yours without parameters and someone\'s suggestion with his ID.')
                    .setRequired(false))
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('Delete yours without parameters and someone\'s suggestion with his tag.')
                    .setRequired(false)))
    .addSubcommand(subcommand =>
        subcommand  
            .setName('list')
            .setDescription('List all suggestions')
            .addStringOption(option =>
                option.setName('options')
                    .setDescription('Show yours without parameters and someone\'s with his ID or everyone\'s with parameter all.')
                    .setRequired(false))
            .addUserOption(option =>
                option.setName('user')
                    .setDescription('Show yours without parameters and someone\'s with his tag.')
                    .setRequired(false)))
    .setDMPermission(true)

module.exports.run = async (client, message, args) => {
    const getUserSuggestionbyId = sent.prepare("SELECT * FROM infos WHERE id = ?;");
    const addSuggestion = sent.prepare("INSERT INTO infos (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);");
    const getSuggestionsAll = sent.prepare("SELECT id, user, name, suggestions FROM infos;").all();

    switch (interaction.options.getSubcommand()) {
        case 'add':
            addSuggestion.run({
                id: interaction.user.id,
                user: interaction.user.username,
                name: interaction.options.getString('name'),
                suggestions: interaction.options.getString('description')
            });
            interaction.reply("Your suggestion has been added !");
            break;
        case 'remove':
            if (!interaction.user.id === admin) return;

            if (!interaction.options.getString('id')) {
                if (!getUserSuggestionbyId.get(interaction.user.id))
                return interaction.reply('You never sent any suggestions!')

                sent.prepare(`DELETE FROM infos WHERE id = ${interaction.user.id};`).run();

                interaction.reply(`User ${interaction.member.user.username} (${interaction.member.id}) suggestion deleted !`);
            } else if (interaction.options.getUser('user')) {
                const getMentionTag = interaction.options.getUser('user');

                sent.prepare(`DELETE FROM infos WHERE id = ${getMentionTag.id};`).run();
                interaction.reply(`User ${getMentionTag.username} (${getMentionTag.id}) suggestion deleted!`)
            } else {
                if (interaction.options.getString('id').match(/([0-9]*)/)) {
                    const getMentionId = interaction.options.getString('user').match(/([0-9]*)/);
                    const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1]);

                    if (!getUserObjectId)
                    return interaction.reply('This user never sent any suggestions!')

                    sent.prepare(`DELETE FROM infos WHERE id = ${getUserObjectId};`).run();
                    interaction.reply(`User ${getUserObjectId.user} (${getUserObjectId.id}) suggestion deleted!`)
                }
            }
            break;
        case 'list':
            if (!interaction.options.getString('options')) {

                const getIndividualEmbed = new EmbedBuilder()
                    .setTitle('Your suggestions')
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                    .setDescription(`You have ${getUserSuggestionbyId.all(interaction.member.id).length} suggestion(s) :`)
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

                for (const data of getUserSuggestionbyId.all(interaction.member.id)) {
                    getIndividualEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                }

                interaction.reply({ embeds: [getIndividualEmbed] });

            } else if (interaction.options.getString('options') === 'all') {
                const getEveryoneEmbed = new EmbedBuilder()
                    .setTitle('All users suggestions')
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                    .setDescription(`I found ${getSuggestionsAll.length} suggestion(s) :`)
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

                for (const data of getSuggestionsAll) {
                    getEveryoneEmbed.addFields({name: `${data.user} (${data.id})`, value:`${data.name}: ${data.suggestions}`, inline: false})
                }

                interaction.reply({ embeds: [getEveryoneEmbed] });

            } else if (interaction.options.getUser('user')) {
                const getMentionTag = interaction.options.getUser('user');
                const getUserSuggestionbyTag = sent.prepare("SELECT * FROM infos WHERE id = ?;").all(getMentionTag.id);

                const getUserTagEmbed = new EmbedBuilder()
                    .setTitle(`${getMentionTag.username}'s suggestions`)
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                    .setDescription(`User ${getMentionTag.username} (${getMentionTag.id}) has ${getUserSuggestionbyTag.length} suggestion(s) :`)
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})
            
                for (const data of getUserSuggestionbyTag) {
                    getUserTagEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                }

                interaction.reply({ embeds: [getUserTagEmbed] });

            } else if (interaction.options.getString('options').match(/([0-9]*)/)) {
                const getMentionId = interaction.options.getString('options').match(/([0-9]*)/);
                const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1]);
                const getMentionIdAllSuggestions = getUserSuggestionbyId.all(getUserObjectId.id);

                if (!getUserObjectId) return interaction.reply('This user never sent any suggestions!');

                const getUserIdEmbed = new EmbedBuilder()
                    .setTitle(`${getUserObjectId.user}'s suggestions`)
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                    .setDescription(`User ${getUserObjectId.user} (${getUserObjectId.id}) has ${getMentionIdAllSuggestions.length} suggestion(s) :`)
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

                for (const data of getMentionIdAllSuggestions) {
                    getUserIdEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                }

                interaction.reply({ embeds: [getUserIdEmbed] });
                
            }
            break;
    }
};