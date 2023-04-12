const db = require('better-sqlite3');
const moment = require('moment');
const logger = new db('./database/devtools/logs.sqlite');
const { admin, devserver } = require('../../settings.json');

// Create the json script for the help command
module.exports.help = {
    name : "logs",
    description: 'Get data from your query',
    aliases : ['log'],
    usage : '<query>',
    parameters : 'file extension, query',
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Check if the user is the admin
    if (message.author.id !== admin || message.guild.id !== devserver) return;

    try {

        // Get the query after the extension
        const query = args.slice(1).join(' ');

        // Get the data from the database
        const data = logger.prepare(query).all();

        // Get the extension of the file from a valid list
        const extension = ['csv', 'txt', 'html', 'message'].includes(args[0]) ? args[0] : 'html';

        // Format file name for the attachment with date and time
        const fileName = `logs-${moment().format('MM-DD-YYYY-HH-mm-ss')}.${extension}}`;

        switch (extension) {
            case 'csv':
                // Send the data to the channel in a CSV file format (in a file)
                message.channel.send({ files: [{ attachment: Buffer.from(data.map(x => Object.values(x).join(',')).join('\n')), name: fileName }] });
                break;
            case 'txt':
                // Send the data to the channel in a txt file format
                message.channel.send({ files: [{ attachment: Buffer.from(JSON.stringify(data, null, 2)), name: fileName }] });
                break;
            case 'html':
                // Send the data to the channel in a HTML table format (in a file)
                message.channel.send({ files: [{ attachment: Buffer.from(`<table><tr>${Object.keys(data[0]).map(x => `<th>${x}</th>`).join('')}</tr>${data.map(x => `<tr>${Object.values(x).map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`), name: fileName }] });
                break;
            case 'message':
                try {
                    // Send the data into a simple message (max 2000 characters)
                    message.channel.send(data.map(x => Object.values(x).join(',')).join('\n').slice(0, 2000));
                } catch (error) {
                    return;
                }
                break;
        }
    } catch(error) {
        // If an error occurs, log it
        console.log(error)
    }
};
