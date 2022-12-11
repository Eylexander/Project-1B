const { EmbedBuilder } = require('discord.js');
const db = require('better-sqlite3')
const dev = new db('./database/devtool.sqlite')
const { admin } = require('../../settings.json')

module.exports.help = {
    name : "todo",
    description: 'Get todo list!',
    aliases : ['td'],
    usage : '[none]',
    parameters: 'none'
};

module.exports.execute = async (client, message, args) => {
    const getTodobyId = dev.prepare("SELECT id FROM tool WHERE id = ?;");
    const count = dev.prepare("SELECT * FROM tool").all();

    if (!message.author.id === admin) return;
    if (!args[1] && !args[0] == ('list' || 'show')) {
        return message.channel.send("You need to provide your idea.")
    }

    switch (args[0]) {
        case 'plus':
        case 'add':
        case 'create':
            let getBiggestId = dev.prepare("SELECT MAX(id) FROM tool").get();
            let createID = Number(getBiggestId['MAX(id)']) + 1;
            dev.prepare(
                `INSERT INTO tool (id, todo) VALUES (${createID}, '${args.slice(1).join(' ')}');`
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
            const countEmbed = new EmbedBuilder()
                .setDescription(`Todo's`)
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            for (const data of count) {
                countEmbed.addFields({ name: `ID : ${data.id}`, value: data.todo, inline: false})
            }

            message.channel.send({ embeds : [countEmbed] })
            break;
        default:
            message.channel.send("You need to provide your idea.");
            break;
    }
};