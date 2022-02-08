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
    const count = dev.prepare("SELECT COUNT(*) FROM tool");
    const deltodo = dev.prepare("DELETE FROM tool WHERE number = ?;");

    if (!args[0]) {
        if (!message.author.id === admin) return;
        message.channel.send("You need to provide your idea.")
    } else if (['add','plus'].includes(args[0])){
        if (!args[1]) {
            message.channel.send("I can't add an empty value.")
        } else {
            addtodo.run({
                id : message.author.id,
                user : message.author.tag,
                todo : args[1],
                number : count + 1
            })
            message.channel.send('The task wad added correctly.')
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
        message.channel.send(`You send ${user.number} todo's : ${user.todo.map(u=>u.user.todo).join('\n')}`)
    } else {
        message.channel.send('Yup, I bugged')
        message.channel.send('```' + (console.error()) + '```')
    }
};