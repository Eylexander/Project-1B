const { prefix, admin } = require('../../settings.json');
const { EmbedBuilder } = require('discord.js');

const db = require("better-sqlite3");
const sent = new db('./database/infos.sqlite');

module.exports.help = {
    name : "suggestion",
    description : "Add a suggestion to the todo list!",
    aliases : ['suggest', 'sugg'],
    usage : "[parameter] [name] [description]",
    parameters : ['add', 'new', 'create', 'remove', 'del', 'rem']
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
                    const getMentionId = args[1].match(/([0-9]*)/)
                    const getUserObjectId = client.users.cache.get(getMentionId[1])
                    if (getUserSuggestionbyId.get(getUserObjectId.id)) {
                        sent.prepare(`DELETE FROM infos WHERE id = ${getUserObjectId.id};`).run();
                        message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) suggestion deleted !`);
                    }
                }
                return;
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
                        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
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
                        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
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
                            .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
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
                            // const getUserObjectId = client.users.cache.get(getMentionId[1])
                            const getUserObjectId = message.guild.members.cache.get(getMentionId[1])
                            console.log(getUserObjectId)

                            const getUserIdEmbed = new EmbedBuilder()
                                .setTitle(`${getUserObjectId.username}'s suggestions`)
                                .setColor(Math.floor(Math.random() * 16777214) + 1)
                                .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                                .setDescription(`User ${getUserObjectId.username} (${getUserObjectId.id}) has ${getUserSuggestionbyId.all(getUserObjectId.id).length} suggestion(s) :`)
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
}