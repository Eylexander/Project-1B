const Discord = require('discord.js');
const db = require('better-sqlite3')
const dev = new db('./database/devtool.sqlite')
const admin = require('../../settings.json')

module.exports.help = {
    name : "todo",
    description: 'Get todo list!',
    aliases : ['td'],
    usage : '[none]'
};

module.exports.execute = async (client, message, args) => {
    const gettodo = dev.prepare("SELECT * FROM tool WHERE id = ?;");
    const addtodo = dev.prepare(
        "INSERT INTO tool (id, todo) VALUES (@id, @todo);"
    );
    const count = dev.prepare("SELECT COUNT (id) FROM tool");
    const deltodo = dev.prepare("DELETE FROM tool WHERE id = ?;");

    if (!message.author.id === admin) return;

    if (!args[0]) {
        return message.channel.send("You need to provide your idea.")
    } else if (['add','plus'].includes(args[0])){
        if (!args[1]) {
            message.channel.send("I can't add an empty value.")
        } else {
            const param = args.slice(1)
            addtodo.run({
                id : Math.ceil(Math.random()*100),
                todo : param.join(' '),
            })
            message.channel.send('The task was added correctly. :thumbsup:')
        }
    } else if (['remove', 'del'].includes(args[0])) {
        if (!args[1]) {
            message.channel.send("You need to provide something!")
        } else if (Number(args[1])) {
            deltodo.run({
                id : Number(args[1])
            })
        } else {
            message.channel.send('I can\'t delete a word. Specify a number')
        }
    } else if (['list', 'count'].includes(args[0])) {
        message.channel.send(count.number.map().join('\n'))
    } else {
        message.channel.send('Yup, I bugged')
        message.channel.send('```' + (console.error()) + '```')
    }
};