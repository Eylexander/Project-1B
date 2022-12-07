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
    const getTodo = dev.prepare("SELECT * FROM tool WHERE id = ?;");
    const addTodo = dev.prepare(
        "INSERT INTO tool (id, todo) VALUES (@id, @todo);"
    );
    const getTodobyId = dev.prepare("SELECT id FROM tool WHERE id = ?;");
    const count = dev.prepare("SELECT * FROM tool").all();

    if (!message.author.id === admin) return;
    if (!args[0]) {
        return message.channel.send("You need to provide your idea.")
    } else {
        if (!args[1] && !args[0] == ('list' || 'show')) {
            return message.channel.send("You need to provide your idea.")
        }
    }

    switch (args[0]) {
        case 'plus':
        case 'add':
        case 'create':
            let getBiggestId = dev.prepare("SELECT MAX(id) FROM tool").get();
            dev.prepare(
                `INSERT INTO tool (id, todo) VALUES (${getBiggestId['MAX(id)'] + 1}, '${args.slice(1).join(' ')}');`
            ).run();
            message.channel.send('The task was added correctly. :thumbsup:')
            break;
        case 'del':
        case 'remove':
        case 'delete':
            if (getTodobyId.get(args[1])) {
                dev.prepare(`DELETE FROM tool WHERE id = ${args[1]};`).run()
                message.channel.send('The task was removed correctly. :thumbsup:')
            } else {
                message.channel.send('I can\'t find that task. :thumbsdown:')
            }
            break;
        case 'list':
        case 'show':
            const countEmbed = new Discord.MessageEmbed()
            .setDescription(`Todo's`)
            .setColor('RANDOM')
            .setTimestamp()
            .setFooter(`Requested by ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))

            for (const data of count) {
                countEmbed.addFields({ name: `ID : ${data.id}`, value: data.todo, inline: false})
            }

            message.channel.send(countEmbed)
            break;
        default :
            break;
    }
};