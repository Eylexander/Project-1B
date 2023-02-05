const { EmbedBuilder } = require('discord.js');
const { admin } = require('../../settings.json')
const db = require('better-sqlite3')
const dev = new db('./database/devtools/devtool.sqlite')

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
    const getTodobyId = dev.prepare("SELECT id FROM tool WHERE id = ?;");
    // Get all the todo list to count them
    const count = dev.prepare("SELECT id FROM tool").all();

    // Check if the user didn't provide any arguments
    if (!args[1] && ['list', 'show'].includes(args[0])) {
        return message.reply({
            content: 'You need to provide a task to add to the todo list.',
            allowedMentions: { repliedUser: false }
        })
    }

    // Check the inputs
    switch (args[0]) {
        case 'plus':
        case 'add':
        case 'create':
            // Add the task to the todo list
            dev.prepare(
                `INSERT INTO tool (todo) VALUES ('${args.slice(1).join(' ')}');`
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
            // Check if the task exist
            if (getTodobyId.get(args[1])) {
                // If the task exist, remove it
                dev.prepare(`DELETE FROM tool WHERE id = ${args[1]};`).run()

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
                content: 'You need to provide a valid argument. :thumbsdown:',
                allowedMentions: { repliedUser: false }
            });
            break;
    }
};