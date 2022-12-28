const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { admin } = require('../../settings.json')
const db = require('better-sqlite3')
const dev = new db('./database/devtool.sqlite')

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
            dev.prepare(
                `INSERT INTO tool (todo) VALUES ('${args.slice(1).join(' ')}');`
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

module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a task to the todo list')
            .addStringOption(option =>
                option
                    .setName('task')
                    .setDescription('The task you want to add')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a task from the todo list')
            .addIntegerOption(option =>
                option
                    .setName('id')
                    .setDescription('The ID of the task you want to remove')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all the tasks in the todo list'))
    .setDMPermission(true)

module.exports.run = async (client, interaction) => {
    if (!(interaction.member?.user.id ?? interaction.user.id) === admin) return;
    const getTodobyId = dev.prepare("SELECT id FROM tool WHERE id = ?;");
    const count = dev.prepare("SELECT * FROM tool").all();

    switch (interaction.options.getSubcommand()) {
        case 'add':
            dev.prepare(
                `INSERT INTO tool (todo) VALUES ('${interaction.options.getString('task')}');`
            ).run();
            interaction.reply('The task was added correctly. :thumbsup:')
            break;
        case 'remove':
            if (getTodobyId.get(interaction.options.getInteger('id'))) {
                dev.prepare(`DELETE FROM tool WHERE id = ${interaction.options.getInteger('id')};`).run()
                interaction.reply('The task was removed correctly. :thumbsup:')
            } else {
                interaction.reply('I can\'t find that task. :thumbsdown:')
            }
            break;
        case 'list':
            const countEmbed = new EmbedBuilder()
                .setDescription(`Todo's`)
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTimestamp()
                .setFooter({
                    text :`Requested by ${interaction.member?.user.username ?? interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                })

            for (const data of count) {
                countEmbed.addFields({ name: `ID : ${data.id}`, value: data.todo, inline: false})
            }

            interaction.reply({ embeds : [countEmbed] })
            break;
    }
};