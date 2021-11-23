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
        "INSERT INTO tool (user, todo, number) VALUES (@user, @todo, @number);"
    );
    const deltodo = dev.prepare("DELETE FROM tool WHERE number = ?;")

    if (!args[0]) {
        if (!admin) {
            return
        } else {
            message.channel.send("You need to provide your idea.")
        }
    } else if (['add'].includes(args[0])){
        if (!args[1]) {
            message.channel.send("I can't add an empty value.")
        } else {
            addtodo.run({
                id : message.author.tag,
                todo : args[1] > 1,
                number : gettodo.lenght() + 1
            })
            message.channel.send('The task wad added correctly.')
        }
    } else if (['remove', 'del'].includes(args[0])) {
        if (!args[1]) {
            message.channel.send("You need to provide something!")
        } else {
            deltodo.run({
                number : args[1]
            })
        }
    } else if (['list', 'count'].includes(args[0])) {
        let user = gettodo.get(message.author.id)
        message.channel.send(`You send ${user.number} todo's : ${user.todo.map(u=>u.user.todo).join('\n')}`)
    } else {
        message.channel.send('Yup, I bugged')
        message.channel.send('```' + (console.error()) + '```')
    }
};