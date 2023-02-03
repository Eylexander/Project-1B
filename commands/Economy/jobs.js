const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { admin } = require("../../settings.json");
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "jobs",
    description: 'Search for a job',
    aliases: ['job'],
    usage: '[parameters] [arguments]',
    parameters: '<list | join | leave>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {
    // Get the list of jobs from the database by ID order
    const list = bus.prepare("SELECT * FROM business ORDER BY id ASC;").all();
    // Get the user's job status
    const checkJobsStatus = inv.prepare("SELECT businessID FROM stats WHERE id = ?").get(message.author.id);

    // Create a function to get the job's name
    const getJobsNames = list.map((data) => data.business);
    // Create a function to get the job's ID
    const getJobsIDs = list.map((data) => data.id);
    // Creation of a function to capitalize the first letter of a string
    const makeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

    // Check the inputs
    switch (args[0]) {
        case 'add':
            // Check if the user is an admin
            if (!message.author.id === admin) return;
            // Check if the user has specified all the parameters
            if (args.length<=4)
            return message.reply({ content: "You need to specify an ID, a name, a salary, a level and a description for the job!", allowedMentions: { repliedUser: false } });

            // Prepare the database to add a new job
            const addNewJob = bus.prepare("INSERT INTO business (id, business, salary, level, description, image) VALUES (@id, @business, @salary, @level, @description, @image);");
            
            // Check if the ID, the salary and the level are numbers
            if (!(Number(args[1]) || Number(args[3]) || Number(args[4]))) return message.reply({ content: "The ID, the salary and the level must be numbers!", allowedMentions: { repliedUser: false } });
            
            // Check if the job already exists in the database and add it if it doesn't
            const checkJobonAdd = bus.prepare("SELECT * FROM business WHERE id = ?").get(args[1]);
            if (!checkJobonAdd) {
                addNewJob.run({
                    id: args[1],
                    business: args[2].toLowerCase(),
                    salary: args[3],
                    level: args[4],
                    number: 0,
                    description: args.slice(5).join(" "),
                    image: null
                });

                // Send a confirmation message
                message.reply({ content: "The job has been added!", allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "The job already exists!", allowedMentions: { repliedUser: false } });
            }
            break;

        case 'delete':
        case 'remove':
            // Check if the user is an admin
            if (!message.author.id === admin) return;
            // Check if the user has specified an ID
            if (args.length>1) return message.reply({ content: "You only need to specify an ID for the job!", allowedMentions: { repliedUser: false } });
            
            // Prepare the database to remove a job
            const removeJob = bus.prepare("DELETE FROM business WHERE id = ?;");

            // Check if the ID is a number
            if (!Number(args[1]))
            return message.reply({ content: "The ID must be a number!", allowedMentions: { repliedUser: false } });
            
            // Check if the job exists in the database and remove it if it does
            const checkJobonRemove = bus.prepare("SELECT * FROM business WHERE id = ?").get(args[1]);
            if (checkJobonRemove) {
                removeJob.run(args[1]);

                message.reply({ content: "The job has been removed!", allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "The job doesn't exist!", allowedMentions: { repliedUser: false } });
            }
            break;

        case 'edit':
            // Check if the user is an admin
            if (!message.author.id === admin) return;

            // Check if the user has specified all the parameters
            if (args.length<=3) return message.reply({ content: "You need to specify an ID, a column and a value for the job!", allowedMentions: { repliedUser: false } });
            
            // Check if the column is valid
            if (!['id', 'business', 'salary', 'level', 'number', 'description', 'image'].includes(args[2])) {
                return message.reply({ content: "The column must be one of the following: id, business, salary, level, number, description, image!", allowedMentions: { repliedUser: false } });
            }
            // Check if the ID is a number
            else if (!Number(args[1])) return message.reply({ content: "The ID must be a number!", allowedMentions: { repliedUser: false } });
            
            // Check if the column is description or business and get the new value
            const getNewValue = ['description', 'business'].includes(args[2]) ? args.slice(3).join(" ") : args[3];

            // Prepare the database to edit a job
            const editJob = bus.prepare(`UPDATE business SET ${args[2]} = ? WHERE id = ?;`);
            // Check if the job exists in the database
            const checkJobonEdit = bus.prepare("SELECT * FROM business WHERE id = ?").get(args[1]);
            
            // Check if the job exists in the database and edit it if it does
            if (checkJobonEdit) {
                editJob.run(getNewValue, args[1]);
                message.reply({ content: "The job has been edited!", allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "The job doesn't exist!", allowedMentions: { repliedUser: false } });
            }
            break;
        case "all":
        case 'info':
        case "list":
            // Check if the user has specified an ID Job
            // If not, send the list of all jobs
            if (!args[1]) {

                // If the database is empty, send an error message
                if (list.length === 0)
                return message.reply({ content: "There are no jobs available!", allowedMentions: { repliedUser: false } });

                // Create the embed
                const getEveryJobsEmbed = new EmbedBuilder()
                    .setTitle("Here is the list of all jobs available!")
                    .setColor(Math.floor(Math.random()*16777215) + 1)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setDescription(list.map((data) => `**${makeName(data.business)}** (${data.id})\n${data.description}`).join("\n\n"))
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

                // Send the embed
                message.reply({ embeds: [getEveryJobsEmbed], allowedMentions: { repliedUser: false } });
    
            } else if (getJobsNames.includes(args[1])) {
                // If the user has specified a job name, send the info about the job
                // Prepare the database to get the job info
                const getJobbyName = bus.prepare("SELECT * FROM business WHERE business = ?;").get(args[1]);
                
                // Create the embed
                const getJobNameEmbed = new EmbedBuilder()
                    .setTitle(makeName(getJobbyName.business))
                    .setColor(Math.floor(Math.random()*16777215) + 1)
                    .setThumbnail(client.user.displayAvatarURL())   
                    .setDescription(getJobbyName.description.toString())
                    .addFields(
                        { name: "ID", value: getJobbyName.id.toString(), inline: true },
                        { name: "Salary", value: `${getJobbyName.salary.toString()} $/hour`, inline: true },
                        { name: "Level", value: getJobbyName.level.toString(), inline: true },
                        { name: "Number of Workers", value: getJobbyName.number.toString(), inline: true }
                    )
                    .setTimestamp()
                    .setImage(getJobbyName.image === null ? message.author.displayAvatarURL() : getJobbyName.image)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })

                // Send the embed
                message.reply({
                    embeds: [getJobNameEmbed],
                    allowedMentions: { repliedUser: false }
                })

            } else if (getJobsIDs.includes(args[1])) {
                // If the user has specified a job ID, send the info about the job
                // Prepare the database to get the job info
                const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(args[1]);
                
                // Create the embed
                const getJobIDEmbed = new EmbedBuilder()
                    .setTitle(makeName(getJobbyID.business))
                    .setColor(Math.floor(Math.random()*16777215) + 1)
                    .setThumbnail(client.user.displayAvatarURL())   
                    .setDescription(getJobbyID.description.toString())
                    .addFields(
                        { name: "ID", value: getJobbyID.id.toString(), inline: true },
                        { name: "Salary", value: `${getJobbyID.salary.toString()} $/hour`, inline: true },
                        { name: "Level", value: getJobbyID.level.toString(), inline: true },
                        { name: "Number of Workers", value: getJobbyID.number.toString(), inline: true }
                    )
                    .setTimestamp()
                    .setImage(getJobbyID.image === null ? message.author.displayAvatarURL() : getJobbyID.image)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })

                // Send the embed
                message.reply({
                    embeds: [getJobIDEmbed],
                    allowedMentions: { repliedUser: false }
                })
            }
            break;

        case "join":
            // Check if the user has specified a job ID to join
            if (!args[1])
            return message.reply({ content: "You need to specify a job ID!", allowedMentions: { repliedUser: false } });

            if (getJobsIDs.includes(args[1])) {
                // Check if the numerical input is a job ID
                // Check if the user has already a job
                if (checkJobsStatus.businessID !== 0)
                return message.reply({ content: "You already have a job!\nYou need to leave it first!", allowedMentions: { repliedUser: false } });

                // Prepare the database to get the job info
                const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(args[1]);

                // Update the database to add the job to the user
                inv.prepare(`UPDATE stats SET businessID = ? WHERE id = ?;`).run(getJobbyID.id, message.author.id);

                // Send the confirmation message
                return message.reply({ content: `You have joined the job **${makeName(getJobbyID.business)}**!`, allowedMentions: { repliedUser: false } });

            } else if (getJobsNames.includes(args[1].toLowerCase())) {
                // Check if the string input is a job name
                // Check if the user has already a job
                if (checkJobsStatus.business !== 0)
                return message.reply({ content: "You already have a job!\nYou need to leave it first!", allowedMentions: { repliedUser: false } });
                
                // Prepare the database to get the job info
                const getJobbyName = bus.prepare("SELECT * FROM business WHERE business = ?;").get(args[1].toLowerCase());

                // Update the database to add the job to the user
                inv.prepare(`UPDATE stats SET businessID = ? WHERE id = ?;`).run(getJobbyName.id, message.author.id);

                // Send the confirmation message
                return message.reply({ content: `You have joined the job **${makeName(getJobbyName.business)}**!`, allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "This job doesn't exist!", allowedMentions: { repliedUser: false } });
            }
            break;

        case "leave":
            // Check if the user has a job
            if (checkJobsStatus.business == 0)
            return message.reply({ content: "You don't have a job!", allowedMentions: { repliedUser: false } });
            
            // Prepare the database to get the job info
            const checkJobsID = inv.prepare("SELECT * FROM stats WHERE id = ?;").get(message.author.id);
            const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(checkJobsID.businessID.toString());

            // Update the database to remove the job from the user
            inv.prepare(`UPDATE stats SET business = ?, businessID = ? WHERE id = ?;`).run('none', null, message.author.id);

            // Send the confirmation message
            message.reply({ content: `You have left your job **${makeName(getJobbyID.business)}**!`, allowedMentions: { repliedUser: false } });
            break;
        
        default:
            message.reply({
                content: "You need to specify a subcommand!\nUse `/help jobs` to list all the jobs available",
                allowedMentions: { repliedUser: false }
            });
            break;
    }
};

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all the jobs available'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('join')
            .setDescription('Join a job')
            .addIntegerOption(option =>
                option
                    .setName('id')
                    .setDescription('The ID of the job you want to join')
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('leave')
            .setDescription('Leave your current job'))
    .setDMPermission(true)

// Create the run script for the interaction command
module.exports.run = async (client, interaction) => {
    interaction.reply({ content: "This command is not yet available!", ephemeral: true })
};