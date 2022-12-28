const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
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
    switch (args[0]) {
        case "all":
        case "list":
            const list = bus.prepare("SELECT * FROM business;").all();
            const getJobsList = new EmbedBuilder()
                .setTitle("Jobs List")
                .setColor(Math.floor(Math.random()*16777215) + 1)
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription("Here is the list of all the jobs available!")
                .addFields()
                .setTimestamp()
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            
            for (const data of list) {
                getJobsList.addField(data.name, `**ID:** ${data.id}\n**Salary:** ${data.salary} $/hour\n**Level:** ${data.level}\n**Description:** ${data.description}`)
            }

            message.reply({ embeds: [getJobsList], allowedMentions: { repliedUser: false }})
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