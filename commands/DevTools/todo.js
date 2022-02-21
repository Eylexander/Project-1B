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
    const gettodo = dev.prepare("SELECT * FROM tool WHERE user = ?;");
    const addtodo = dev.prepare(
        "INSERT INTO tool (id, user, todo, number) VALUES (@id, @user, @todo, @number);"
    );
    const count = dev.prepare("SELECT COUNT (number) FROM tool");
    const deltodo = dev.prepare("DELETE FROM tool WHERE number = ?;");

    if (!message.author.id === admin) return;

    if (!args[0]) {
        message.channel.send("You need to provide your idea.")
    } else if (['add','plus'].includes(args[0])){
        if (!args[1]) {
            message.channel.send("I can't add an empty value.")
        } else {
            const param = args.slice(1)
            addtodo.run({
                id : message.author.id,
                user : message.author.tag,
                todo : param.join(' '),
                number : count + 1
            })
            message.channel.send('The task was added correctly. :thumbsup:')
        }
    } else if (['remove', 'del'].includes(args[0])) {
        if (!args[1]) {
            message.channel.send("You need to provide something!")
        } else if (Number(args[1])) {
            deltodo.run({
                number : Number(args[1])
            })
        } else {
            message.channel.send('I can\'t delete a word. Specify a number')
        }
    } else if (['list', 'count'].includes(args[0])) {
        const user = gettodo.get(message.author.id)
        message.channel.send(`You send ${count.number} todo's : ${user.map().join('\n')}`)
    } else {
        message.channel.send('Yup, I bugged')
        message.channel.send('```' + (console.error()) + '```')
    }
};