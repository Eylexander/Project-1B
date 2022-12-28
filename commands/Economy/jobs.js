const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { admin } = require("../../settings.json");
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');

module.exports.help = {
    name: "jobs",
    description: 'Search for a job',
    aliases: ['job'],
    usage: '[actions] [parameters]',
    parameters: '<list | join | leave>'
};

module.exports.execute = async (client, message, args) => {
    const list = bus.prepare("SELECT * FROM business ORDER BY id ASC;").all();
    const checkJobsStatus = inv.prepare("SELECT business FROM stats WHERE id = ?").get(message.author.id);
    const getJobsNames = list.map((data) => data.business);
    const getJobsIDs = list.map((data) => data.id);
    const makeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

    switch (args[0]) {
        case 'add':
            if (!message.author.id === admin) return;
            if (args<=4) return message.reply({ content: "You need to specify an ID, a name, a salary, a level and a description for the job!", allowedMentions: { repliedUser: false } });

            const addNewJob = bus.prepare("INSERT INTO business (id, business, salary, level, number, description, image) VALUES (@id, @business, @salary, @level, @number, @description, @image);");
            
            if (!(Number(args[1]) || Number(args[3]) || Number(args[4]))) return message.reply({ content: "The ID, the salary and the level must be numbers!", allowedMentions: { repliedUser: false } });
            
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

                message.reply({ content: "The job has been added!", allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "The job already exists!", allowedMentions: { repliedUser: false } });
            }
            break;
        case 'delete':
        case 'remove':
            if (!message.author.id === admin) return;
            if (args>=1) return message.reply({ content: "You only need to specify an ID for the job!", allowedMentions: { repliedUser: false } });
            const removeJob = bus.prepare("DELETE FROM business WHERE id = ?;");
            const getRemoveArgstoNumber = Number(args[1]);

            if (getRemoveArgstoNumber === NaN) return message.reply({ content: "The ID must be a number!", allowedMentions: { repliedUser: false } });
            
            const checkJobonRemove = bus.prepare("SELECT * FROM business WHERE id = ?").get(args[1]);
            if (checkJobonRemove) {
                removeJob.run(args[1]);
                message.reply({ content: "The job has been removed!", allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "The job doesn't exist!", allowedMentions: { repliedUser: false } });
            }
            break;
        case 'edit':
            if (!message.author.id === admin) return;

            if (args<=3) return message.reply({ content: "You need to specify an ID, a column and a value for the job!", allowedMentions: { repliedUser: false } });
            const getEditArgstoNumber = Number(args[1]);
            if (!['id', 'business', 'salary', 'level', 'number', 'description', 'image'].includes(args[2])) return message.reply({ content: "The column must be one of the following: id, business, salary, level, number, description, image!", allowedMentions: { repliedUser: false } });
            else if (getEditArgstoNumber === NaN) return message.reply({ content: "The ID must be a number!", allowedMentions: { repliedUser: false } });
            else if (!args[3]) return message.reply({ content: "You need to specify a value!", allowedMentions: { repliedUser: false } });
            
            const getNewValue = ['description', 'business'].includes(args[2]) ? args.slice(3).join(" ") : args[3];

            const editJob = bus.prepare(`UPDATE business SET ${args[2]} = ? WHERE id = ?;`);
            const checkJobonEdit = bus.prepare("SELECT * FROM business WHERE id = ?").get(args[1]);
            
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
            if (!args[1]) {

                if (list.length === 0) return message.reply({ content: "There are no jobs available!", allowedMentions: { repliedUser: false } });

                const getEveryJobsEmbed = new EmbedBuilder()
                    .setTitle("Here is the list of all jobs available!")
                    .setColor(Math.floor(Math.random()*16777215) + 1)
                    .setThumbnail(client.user.displayAvatarURL())
                    .setDescription(list.map((data) => `**${makeName(data.business)}** (${data.id})\n${data.description}`).join("\n\n"))
                    .addFields()
                    .setTimestamp()
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

                message.reply({ embeds: [getEveryJobsEmbed] });
    
            } else if (getJobsNames.includes(args[1])) {
                const getJobbyName = bus.prepare("SELECT * FROM business WHERE business = ?;").get(args[1]);
                
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

                message.reply({
                    embeds: [getJobNameEmbed],
                    allowedMentions: { repliedUser: false }
                })

            } else if (getJobsIDs.includes(args[1])) {
                const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(args[1]);
                
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

                    message.reply({
                        embeds: [getJobIDEmbed],
                        allowedMentions: { repliedUser: false }
                    })
            }
            break;
        case "join":
            if (!args[1]) return message.reply({ content: "You need to specify a job ID!", allowedMentions: { repliedUser: false } });

            const getArgs = args[1].toLowerCase();
            if (getJobsIDs.includes(args[1])) {
                const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(args[1]);
                console.log(checkJobsStatus.business)
                // if (checkJobsStatus.business === "none") return message.reply({ content: "You already have a job!\nYou need to leave it first!", allowedMentions: { repliedUser: false } });

                bus.prepare(`UPDATE business SET number = ? WHERE id = ?;`).run(getJobbyID.number++, args[1]);
                inv.prepare(`UPDATE stats SET business = ?, businessID = ? WHERE id = ?;`).run(getJobbyID.business, getJobbyID.id, message.author.id);

                message.reply({ content: `You have joined the job **${makeName(getJobbyID.business)}**!`, allowedMentions: { repliedUser: false } });

            } else if (getJobsNames.includes(args[1].toLowerCase())) {
                const getJobbyName = bus.prepare("SELECT * FROM business WHERE business = ?;").get(args[1].toLowerCase());

                // if (checkJobsStatus.business === "none") return message.reply({ content: "You already have a job!\nYou need to leave it first!", allowedMentions: { repliedUser: false } });

                bus.prepare(`UPDATE business SET number = ? WHERE id = ?;`).run(getJobbyName.number++, getJobbyName.id);
                inv.prepare(`UPDATE stats SET business = ?, businessID = ? WHERE id = ?;`).run(getJobbyName.business, getJobbyName.id, message.author.id);

                message.reply({ content: `You have joined the job **${makeName(getJobbyName.business)}**!`, allowedMentions: { repliedUser: false } });
            } else {
                message.reply({ content: "This job doesn't exist!", allowedMentions: { repliedUser: false } });
            }
            break;

        case "leave":
            if (checkJobsStatus.business === 'none') return message.reply({ content: "You don't have a job!", allowedMentions: { repliedUser: false } });
            
            const checkJobsID = inv.prepare("SELECT * FROM stats WHERE id = ?;").get(message.author.id);
            const getJobbyID = bus.prepare("SELECT * FROM business WHERE id = ?;").get(checkJobsID.businessID.toString());

            bus.prepare(`UPDATE business SET number = ${getJobbyID.number--} WHERE id = '${checkJobsID}';`).run();
            inv.prepare(`UPDATE stats SET business = ?, businessID = ? WHERE id = ?;`).run('none', null, message.author.id);

            message.reply({ content: `You have left your job **${makeName(getJobbyID.business)}**!`, allowedMentions: { repliedUser: false } });
            break;
    }
};

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

module.exports.run = async (client, interaction) => {
    interaction.reply({ content: "This command is not yet available!", ephemeral: true })
};