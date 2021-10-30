const { prefix, admin } = require('../../settings.json');
const moment = require('moment');
const log = message => {console.log(`[${moment().format('MM-DD HH:mm:ss.SSS')}] ${message}`)};

const db = require("better-sqlite3");
const sent = new db('./database/infos.sqlite');

module.exports.help = {
    name : "suggestion",
    description : "Add a suggestion to the todo list!",
    aliases : ['suggest', 'sugg'],
    usage : "[name] [description]"
};

module.exports.execute = async (client, message, args) => {
    const getsuggestion = sent.prepare("SELECT * FROM infos WHERE id = ? AND user = ?");
    const addsuggestion = sent.prepare("INSERT INTO infos (id, user, name, suggestions) VALUES (@id, @user, @name, @suggestions);");

    if (['get', 'see'].includes(args[0])) {
        let targetMember = message.mentions.users.first();

        if (!message.author === admin) return
        if (!args[1]) return message.channel.send('Please, specify someone!')
        if (args[1] === targetMember) {
            message.channel.send(`${targetMember.tag} sent 1 suggestion.\n${infos.name} : ${infos.suggestions}`)
        }
    }

    if (args < 1) {
        message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
    } else {
        addsuggestion.run({
            id : message.author.id,
            user : message.author.tag,
            name : String(args[0]),
            suggestions : String(args.join(' '))
        })
        message.channel.send('Your suggestion was added!')
    }
};