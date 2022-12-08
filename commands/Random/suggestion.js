const { prefix, admin } = require('../../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

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
    const getUserSuggestionbyId = sent.prepare(
        "SELECT * FROM infos WHERE id = ?;"
    );
    const addSuggestion = sent.prepare(
        "INSERT INTO infos (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);"
    );
    const getSuggestions = sent.prepare("SELECT id, user, name, suggestions FROM infos WHERE id = ?;");
    const getSuggestionsAll = sent.prepare("SELECT id, user, name, suggestions FROM infos;").all();

    if (!args[0]) {
        return message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
    }

    if (['get', 'see', 'list'].includes(args[0])) {
        if (!message.author === admin) return;
        switch (args[1]) {
            case /<@!?([0-9]*)>/.test(args[1]):
                const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
                const getUserObjectTag = client.users.cache.get(getMentionTag[1])
    
                message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) has ${getSuggestions.get(getUserObjectTag.id).length} suggestion(s) :`)
                for (const data of getSuggestions.all(getUserObjectTag.id)) {
                    message.channel.send(`\n${data.name} : ${data.suggestions}`)
                }
                break;
            case /([0-9]*)/.test(args[1]):
                const getMentionId = args[1].match(/([0-9]*)/)
                const getUserObjectId = client.users.cache.get(getMentionId[1])

                message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) has ${getSuggestions.get(getUserObjectId.id).length} suggestion(s) :`)
                for (const data of getSuggestions.all(getUserObjectId.id)) {
                    message.channel.send(`\n${data.name} : ${data.suggestions}`)
                }
                break;
            case 'all':
            case 'see':
                message.channel.send(`All suggestions :`)
                for (const data of getSuggestionsAll) {
                    message.channel.send(`${data.user} (${data.id})\n${data.name} : ${data.suggestions}`)
                }
                break;
            default:
                message.channel.send(`User ${message.author.username} (${message.author.id}) has ${getSuggestions.all(message.author.id).length} suggestion(s) :`)
                for (const data of getSuggestions.all(message.author.id)) {
                    message.channel.send(`\n${data.name} : ${data.suggestions}`)
                }
                break;
        }
    } else if (['add', 'new', 'create'].includes(args[0])) {
        addSuggestion.run({
            id: message.author.id,
            user: message.author.username,
            name: args[1],
            suggestions: args.slice(2).join(" ")
        });
        return message.channel.send(`Your suggestion has been added !`);
    } else if (['remove', 'delete', 'del'].includes(args[0])) {
        switch (args[1]) {
            case /<@!?([0-9]*)>/.test(args[1]):
                if (!message.author === admin) return;
                const getMentionTag = args[1].match(/<@!?([0-9]*)>/)
                const getUserObjectTag = client.users.cache.get(getMentionTag[1])

                if (getUserSuggestionbyId.get(getUserObjectTag.id)) {
                    sent.prepare(`DELETE FROM infos WHERE id = ${getUserObjectTag.id};`).run();
                    message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) suggestion deleted !`);
                } else {
                    message.channel.send(`User ${getUserObjectTag.username} (${getUserObjectTag.id}) has no suggestion !`);
                }
                break;
            case /([0-9]*)/.test(args[1]):
                if (!message.author === admin) return;
                const getMentionId = args[1].match(/([0-9]*)/)
                const getUserObjectId = client.users.cache.get(getMentionId[1])

                if (getUserSuggestionbyId.get(getUserObjectId.id)) {
                    sent.prepare(`DELETE FROM infos WHERE id = ${getUserObjectId.id};`).run();
                    message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) suggestion deleted !`);
                } else {
                    message.channel.send(`User ${getUserObjectId.username} (${getUserObjectId.id}) has no suggestion !`);
                }
                break;
            default:
                if (getUserSuggestionbyId.get(message.author.id)) {
                    sent.prepare(`DELETE FROM infos WHERE id = ${message.author.id};`).run();
                    message.channel.send(`User ${message.author.username} (${message.author.id}) suggestion deleted !`);
                }
                break;
        }
    } else {
        return message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
    }
}