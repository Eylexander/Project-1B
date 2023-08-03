const { EmbedBuilder } = require('discord.js');
const { admin } = require('../../settings.json');
const db = require('better-sqlite3');
const { randomColor } = require('../../tools/Loader');
const wordsDB = new db('./database/devtools/words.sqlite');

// Create the json script for the help command
module.exports.help = {
    name : "wordsdb",
    description: 'WordsDB command to add words to the database',
    aliases : ['words','wdb'],
    usage : '[Information]',
    parameters: 'type'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the author is the admin
    if (message.author.id !== admin) return;

    let allowedTypes = ['rickroll', 'suicide', 'badword'];

    let wordInputType = args[1]?.toLowerCase() ?? '';
    let wordInputWord = args[2]?.toLowerCase() ?? '';
    
    switch (args[0]) {
        case 'add':
            if (args.length <= 2)
            return message.reply({
                content: "You have to enter a method, a type and a word to add !",
                allowedMentions: { repliedUser: false }
            }).then(msg => {
                setTimeout(() => {msg.delete()}, 2500)
            });

            console.log('oui')

            if (allowedTypes.includes(wordInputType)) {
                wordsDB
                    .prepare('INSERT INTO words (type, word) VALUES (@type, @word);')
                    .run({
                        type : wordInputType,
                        word : wordInputWord
                    })
                
                message.channel
                    .send(`You just added the word **${wordInputWord}** to the database **${wordInputType}**!`)
                    .then(msg => {
                        setTimeout(() => {msg.delete()}, 2500)
                    });
            }
            break;

        case 'remove':
            if (!args[1]) {
                message.reply({
                    content: "You have to enter the word you want to remove!",
                    allowedMentions: { repliedUser: false }
                }).then(msg => {
                    setTimeout(() => {msg.delete()}, 2500)
                });
            } else {
                try {
                    wordsDB
                        .prepare('DELETE FROM words WHERE word = @word;')
                        .run({
                            word : wordInputWord
                        })
                    
                    message.reply({
                        content: `You just removed the word **${wordInputWord}** from the database!`,
                        allowedMentions: { repliedUser: false }
                    }).then(msg => {
                        setTimeout(() => {msg.delete()}, 2500)
                    });
                } catch (error) {
                    message.reply({
                        content: `There was an error while removing the word **${wordInputWord}** from the database!`,
                        allowedMentions: { repliedUser: false }
                    }).then(msg => {
                        setTimeout(() => {msg.delete()}, 2500)
                    });
                }
            }
            break;

        case 'list':
            
            let words = wordsDB.prepare('SELECT * FROM words;').all();
            let countWordsTypes = wordsDB.prepare('SELECT type, COUNT(*) FROM words GROUP BY type;').all();

            const listWordsEmbed = new EmbedBuilder()
                .setTitle('WordsDB')
                .setDescription('List of all the words in the database')
                .setColor(randomColor())
                .addFields()
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            for (const type of countWordsTypes) {
                let wordsList = '';
                for (const word of words) {
                    if (word.type === type.type) {
                        wordsList += `${word.word}\n`
                    }
                }
                listWordsEmbed.addField({ name: type.type, value: wordsList, inline: true })
            }
                    
            message.reply({
                embeds: [listWordsEmbed],
                allowedMentions: { repliedUser: false }
            })
            break;

        default:
            message.reply({
                content: 'The method you entered is not valid!',
                allowedMentions: { repliedUser: false }
            }).then(msg => {
                setTimeout(() => {msg.delete()}, 2500)
            });
            break;
    }

    // Delete the original message
    setTimeout(() => {message.delete()}, 500)
};