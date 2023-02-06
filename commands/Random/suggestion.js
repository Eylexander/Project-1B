const { admin } = require('../../settings.json');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

// Initiate the database
const db = require("better-sqlite3");
const sent = new db('./database/devtools/suggestions.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "suggestion",
    description: "Add a suggestion to the todo list!",
    aliases: ['suggest', 'sugg'],
    usage: "[parameter] [name] [description]",
    parameters: ['add', 'new', 'create', 'remove', 'del', 'rem']
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check the user's suggestion in the database
    const getUserSuggestionbyId = sent.prepare("SELECT * FROM suggestions WHERE id = ?;");
    // Create the function to add a suggestion
    const addSuggestion = sent.prepare(
        "INSERT INTO suggestions (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);"
    );
    // Create the function to get all the suggestions
    const getSuggestionsAll = sent.prepare("SELECT * FROM suggestions;").all();

    // Checks the inputs
    switch (args[0]) {
        case 'add':
        case 'new':
        case 'create':

            // Check if the user has entered enough arguments
            if (args.length < 3)
            return message.reply({
                content: "You need to enter a name and a description for your suggestion.",
                allowedMentions: { repliedUser: false }
            });

            // Add the suggestion to the database
            addSuggestion.run({
                id: message.author.id,
                user: message.author.username,
                name: args[1],
                suggestions: args.slice(2).join(" ")
            });

            // Send a confirmation message
            message.reply({
                content: "Your suggestion has been added !",
                allowedMentions: { repliedUser: false }
            });
            break;

        case 'remove':
        case 'del':
        case 'rem':

            // Check if the user is the admin of the bot
            if (message.author.id !== admin) return;

            // Check the inputs
            switch (args[1]) {
                case undefined:
                case null:
                    // Check if the user has a suggestion
                    if (getUserSuggestionbyId.get(message.author.id)) {
                        // Delete the suggestion
                        sent.prepare(`DELETE FROM suggestions WHERE id = ${message.author.id};`).run();

                        // Send a confirmation message
                        message.reply({
                            content: "Your suggestion has been deleted !",
                            allowedMentions: { repliedUser: false }
                        })
                    }
                    break;

                default:
                    // Check if the user has entered a mention
                    if (message.mentions.users.first()) {
                        // Get the mention tag
                        const getMentionTag = message.mentions.users.first();
                        // Get the user object
                        const getUserObjectTag = getUserSuggestionbyId.get(getMentionTag.id);

                        // Check if the user has a suggestion
                        if (!getUserObjectTag) return message.reply({
                            content: "This user never sent any suggestions!",
                            allowedMentions: { repliedUser: false }
                        })

                        // Check if the user has a suggestion
                        if (getUserSuggestionbyId.get(getMentionTag.id)) {
                            // Delete the suggestion
                            sent.prepare(`DELETE FROM suggestions WHERE id = ${getMentionTag.id};`).run();

                            // Send a confirmation message
                            message.reply({
                                content: `${getMentionTag.username}'s suggestion has been deleted !`,
                                allowedMentions: { repliedUser: false }
                            })
                        }
                    } else {
                        // Check if the user has entered an id
                        if (args[1].match(/([0-9]*)/)) {
                            // Get the id
                            const getMentionId = args[1].match(/([0-9]*)/);
                            // Get the user object
                            const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1]);

                            // Check if the user has a suggestion
                            if (!getUserObjectId) return message.reply({
                                content: "This user never sent any suggestions!",
                                allowedMentions: { repliedUser: false }
                            })

                            // Delete the suggestion
                            sent.prepare(`DELETE FROM suggestions WHERE id = ${getUserObjectId.id};`).run();

                            // Send a confirmation message
                            message.reply({
                                content: `${getUserObjectId.user}'s suggestion has been deleted !`,
                                allowedMentions: { repliedUser: false }
                            })
                        }
                    }
                    break;
            }
            break;

        case 'get':
        case 'see':
        case 'list':
            switch (args[1]) {
                case 'all':
                case 'everyone':
                case 'allusers':
                    // Check if the user is the admin of the bot
                    if (message.author.id !== admin) return;

                    // Create the embed
                    const getEveryoneEmbed = new EmbedBuilder()
                        .setTitle('Suggestions')
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                        .setDescription(
                            getSuggestionsAll.length < 2
                            ? `Found **${getSuggestionsAll.length}** suggestion :`
                            : `Found **${getSuggestionsAll.length}** suggestions :`
                        )
                        .addFields()
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                    // Add the fields to the embed
                    // Group the suggestions by user
                    const getEachUser = sent.prepare("SELECT DISTINCT user, id FROM suggestions;").all();
                    
                    // Group suggestions by user
                    // Completly stolen from internet
                    const groupedSuggestions = getSuggestionsAll.reduce((acc, data) => {
                        const user = getEachUser.find(user => user.id === data.id);
                        if (!user) return acc;

                        if (!acc[user.id]) {
                            acc[user.id] = {
                                user: user.user,
                                suggestions: []
                            };
                        }

                        acc[user.id].suggestions.push(`**${data.name}** : ${data.suggestions}`);
                        return acc;
                    }, {});

                    // Create an array of fields from grouped suggestions
                    for (const [id, { user, suggestions }] of Object.entries(groupedSuggestions)) {
                        getEveryoneEmbed.addFields({name: `${user} (${id})`, value: suggestions.join('\n'), inline: false})
                    }

                    // Send the embed
                    message.reply({
                        embeds: [getEveryoneEmbed],
                        allowedMentions: { repliedUser: false }
                    })
                    break;

                case undefined:
                case null:

                    // Check if the user has a suggestion
                    const getIndividualEmbed = new EmbedBuilder()
                        .setTitle('Your suggestions')
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
                        .setDescription(
                            getUserSuggestionbyId.all(message.author.id).length < 2
                            ? `You have **${getUserSuggestionbyId.all(message.author.id).length}** suggestion :`
                            : `You have **${getUserSuggestionbyId.all(message.author.id).length}** suggestions :`
                        )
                        .addFields()
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

                    // Add the fields to the embed
                    for (const data of getUserSuggestionbyId.all(message.author.id)) {
                        getIndividualEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                    }

                    // Send the embed
                    message.reply({
                        embeds: [getIndividualEmbed],
                        allowedMentions: { repliedUser: false }
                    })
                    break;

                default:
                    // Check if the user is the admin of the bot
                    if (message.author.id !== admin) return;

                    // Check if the user has entered a mention
                    if (message.mentions.users.first()) {
                        // Get the mention tag
                        const getMentionTag = message.mentions.users.first();
                        const getUserObjectTag = getUserSuggestionbyId.get(getMentionTag.id);

                        // Check if the user has a suggestion
                        if (!getUserObjectTag) return message.reply({
                            content: "This user never sent any suggestions!",
                            allowedMentions: { repliedUser: false }
                        })

                        // Create the embed
                        const getUserTagEmbed = new EmbedBuilder()
                            .setTitle(`${getMentionTag.username}'s suggestions`)
                            .setColor(Math.floor(Math.random() * 16777214) + 1)
                            .setThumbnail(getMentionTag.author.displayAvatarURL({ dynamic : true }))
                            .setDescription(`User ${getMentionTag.username} (${getMentionTag.id}) has ${getUserSuggestionbyId.all(getMentionTag.id).length} suggestion(s) :`)
                            .setDescription(
                                getUserSuggestionbyId.all(getMentionTag.id).length < 2
                                ? `User ${getMentionTag.username} (${getMentionTag.id}) has ${getUserSuggestionbyId.all(getMentionTag.id).length} suggestion :`
                                : `User ${getMentionTag.username} (${getMentionTag.id}) has ${getUserSuggestionbyId.all(getMentionTag.id).length} suggestions :`
                            )
                            .addFields()
                            .setTimestamp()
                            .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                    
                        // Add the fields to the embed
                        for (const data of getUserSuggestionbyId.all(getMentionTag.id)) {
                            getUserTagEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                        }

                        // Send the embed
                        message.reply({
                            embeds: [getUserTagEmbed],
                            allowedMentions: { repliedUser: false }
                        })

                    } else {
                        if (args[1].match(/([0-9]*)/)) {
                            // Get the id
                            const getMentionId = args[1].match(/([0-9]*)/)
                            const getUserObjectId = getUserSuggestionbyId.get(getMentionId[1])
                            
                            // Check if the user has a suggestion
                            if (!getUserObjectId)
                            return message.reply({
                                content: "This user never sent any suggestions!",
                                allowedMentions: { repliedUser: false }
                            })

                            // Create the embed
                            const getUserIdEmbed = new EmbedBuilder()
                                .setTitle(`${getUserObjectId.username}'s suggestions`)
                                .setColor(Math.floor(Math.random() * 16777214) + 1)
                                .setThumbnail(client.user.displayAvatarURL({ dynamic : true })
                                .setDescription(`User ${getUserObjectId.user} (${getUserObjectId.id}) has ${getUserSuggestionbyId.all(getUserObjectId.id).length} suggestion(s) :`)
                                .addFields()
                                .setTimestamp()
                                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })}));

                            // Add the fields to the embed
                            for (const data of getUserSuggestionbyId.all(getUserObjectId.id)) {
                                getUserIdEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
                            }

                            // Send the embed
                            message.reply({
                                embeds: [getUserIdEmbed],
                                allowedMentions: { repliedUser: false }
                            })
                        }
                    }
                    break;
            }
            break;

        case 'drop':

            // Check if the user is the admin of the bot
            if (message.author.id !== admin) return;

            // Check if there is any suggestions
            if (!getSuggestionsAll) return message.reply({
                content: "There is no suggestions!",
                allowedMentions: { repliedUser: false }
            })

            // Drop the table
            sent.prepare("DELETE FROM suggestions;").run();

            // Send the message
            message.reply({
                content: "The suggestions table has been dropped!",
                allowedMentions: { repliedUser: false }
            })
            break;

        default:
            message.reply({
                content: `Unknown subcommand! \nSee \`/help suggestion\` for more information!`,	
                allowedMentions: { repliedUser: false }
            })
            break;
    }
};

// Create the json script for the slash command
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
            .setName('list')
            .setDescription('List all suggestions'))
    .setDMPermission(true)

// Create a the run script for the slash command
module.exports.run = async (client, interaction) => {

    // Get user's suggestions by id
    const getUserSuggestionbyId = sent.prepare("SELECT * FROM suggestions WHERE id = ?;");
    // Create the function to add a suggestion
    const addSuggestion = sent.prepare("INSERT INTO suggestions (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);");
    // Create the function to get all suggestions
    const getSuggestionsAll = sent.prepare("SELECT * FROM suggestions;").all();

    // Check inputs
    switch (interaction.options.getSubcommand()) {
        case 'add':
            // Add the suggestion
            addSuggestion.run({
                id: interaction.user.id,
                user: interaction.user.username,
                name: interaction.options.getString('name'),
                suggestions: interaction.options.getString('description')
            });

            // Send the confirmation message
            interaction.reply("Your suggestion has been added !");
            break;

        case 'list':
            // Create the embed
            const getIndividualEmbed = new EmbedBuilder()
                .setTitle('Your suggestions')
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                .setDescription(`You have ${getUserSuggestionbyId.all(interaction.member?.user.id ?? interaction.user.id).length} suggestion(s) :`)
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true })})

            // Add the fields to the embed
            for (const data of getUserSuggestionbyId.all(interaction.member?.user.id ?? interaction.user.id)) {
                getIndividualEmbed.addFields({name: `${data.name}`, value:`${data.suggestions}`, inline: false})
            }

            // Send the embed
            interaction.reply({ embeds: [getIndividualEmbed] });

            break;
    }
};