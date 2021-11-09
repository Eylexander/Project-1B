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

    const infos = getsuggestion.get(message.author.id, message.author.tag)

    // const userMention = args[1].match(/<@!?([0-9]*)>/)
    // if (userMention == null) {
    //     return message.channel.send('You have to tag someone !');
    // } else {
    //     const user = client.users.get(userMention[1])
    // }

    if (['get', 'see'].includes(args[0])) {
        if (!(message.author === admin)) return
        if (args < 1) {
            message.channel.send(`You sent ${infos.name} : ${infos.suggestions}`)
        }
        // if (args[1] === user) {
        //     message.channel.send(`${user.tag} sent 1 suggestion.\n${infos.name} : ${infos.suggestions}`)
        // }
    };

    if (args < 1 && !(['get', 'see'].includes(args[0]))) {
        message.channel.send(`Please specify your idea using this format : ${prefix}suggestion ${module.exports.help.usage}`)
    } else {
        try {
            sugg = args.shift()
            addsuggestion.run({
                id : message.author.id,
                user : message.author.tag,
                name : String(args[0]),
                suggestions : String(sugg.join(' '))
            })
            message.channel.send('Your suggestion was added!')
        } catch (err) {
            log(err)
            message.channel.send('You can\'t do that')
        }
    };
};