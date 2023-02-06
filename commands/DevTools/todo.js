const { EmbedBuilder } = require('discord.js');
const { admin } = require('../../settings.json')
const db = require('better-sqlite3')
const todo = new db('./database/devtools/todolist.sqlite')

// Create the json script for the help command
module.exports.help = {
    name : "todo",
    description: 'Get todo list!',
    aliases : ['td'],
    usage : '[none]',
    parameters: 'none'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the owner of the bot
    if (message.author.id !== admin) return;

    // Get the id of the todo list from an id
    const getTodobyId = todo.prepare("SELECT id FROM todolist WHERE id = ?;");
    // Get all the todo list to count them
    const count = todo.prepare("SELECT id FROM todolist").all();

    // Check the inputs
    switch (args[0]) {
        case 'plus':
        case 'add':
        case 'create':
            // Check input length
            if (args.length < 2) return message.reply({
                content: 'You need to specify the task you want to add. :thumbsdown:',
                allowedMentions: { repliedUser: false }
            })

            // Add the task to the todo list
            todo.prepare(
                `INSERT INTO todolist (todo) VALUES ('${args.slice(1).join(' ')}');`
            ).run();

            // Send a message to confirm the task was added
            message.reply({
                content: 'The task was added correctly. :thumbsup:',
                allowedMentions: { repliedUser: false }
            })
            break;

        case 'del':
        case 'remove':
        case 'delete':
            // Check input length
            if (args.length < 2) return message.reply({
                content: 'You need to specify the id of the task you want to remove. :thumbsdown:',
                allowedMentions: { repliedUser: false }
            })

            // Check if the task exist
            if (getTodobyId.get(args[1])) {
                // If the task exist, remove it
                todo.prepare(`DELETE FROM todolist WHERE id = ${args[1]};`).run()

                // Send a message to confirm the task was removed
                message.reply({
                    content: 'The task was removed correctly. :thumbsup:',
                    allowedMentions: { repliedUser: false }
                })
            } else {
                // If the task doesn't exist, send a message to confirm it
                message.reply({
                    content: 'I can\'t find that task. :thumbsdown:',
                    allowedMentions: { repliedUser: false }
                })
            }
            break;

        case 'list':
        case 'show':
            // Create the embed
            const countEmbed = new EmbedBuilder()
                .setDescription(`Todo's`)
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
            
            // Add the fields to the embed
            for (const data of count) {
                countEmbed.addFields({ name: `ID : ${data.id}`, value: data.todo, inline: false})
            }

            // Send the embed
            message.reply({
                embeds: [countEmbed],
                allowedMentions: { repliedUser: false }
            })
            break;

        default:
            message.reply({
                content: 'You need to provide a valid argument. :thumbsdown: \nValid arguments are : `plus`, `del`, `list`',
                allowedMentions: { repliedUser: false }
            });
            break;
    }
};