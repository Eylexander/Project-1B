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
    const count = dev.prepare("SELECT * FROM tool").all();
    const deltodo = dev.prepare("DELETE FROM tool WHERE id = ?;");

    if (!message.author.id === admin) return;
    const getTodoList = gettodo.get(args[1])

    if (!args[0]) {
        return message.channel.send("You need to provide your idea.")
    } else if (['add','plus'].includes(args[0])){
        if (!args[1]) {
            message.channel.send("I can't add an empty value.")
        } else {
            const biggestID = dev.prepare("SELECT * FROM tool ORDER BY id DESC LIMIT 1").all();
            for (const loop of biggestID) {
                const param = args.slice(1)
                addtodo.run({
                    id : (loop.id + Number(1)) == false ? Number(1) : loop.id + Number(1),
                    todo : param.join(' '),
                })
                return message.channel.send('The task was added correctly. :thumbsup:')
            }
        }
    } else if (['remove', 'del'].includes(args[0])) {
        if (!args[1]) {
            message.channel.send("You need to provide something!")
        } else if (Number(args[1])) {
            deltodo.run(getTodoList)
        } else {
            message.channel.send('I can\'t delete a word. Specify a number')
        }
    } else if (['list', 'count'].includes(args[0])) {
        const countEmbed = new Discord.MessageEmbed()
            .setDescription(`Todo's`)
            .setColor('RANDOM')
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

        for (const data of count) {
            countEmbed.addFields({ name: `ID : ${data.id}`, value: data.todo, inline: true})
        }

        return message.channel.send(countEmbed)
    } else {
        return message.channel.send('```' + (console.error()) + '```')
    }
};