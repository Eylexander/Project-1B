const { SlashCommandBuilder } = require('discord.js');
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');

// Create the json script for the help command
module.exports.help = {
    name : "work",
    description: 'Make some Money!',
    aliases : ['tryhard','work'],
    usage : '[amount of mana]',
    parameters: '<amount>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Get author user stats
    let stats = inv.prepare("SELECT * FROM stats WHERE id = ?;").get(message.author.id);
    // Set author user stats with inputs
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, businessID, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @businessID, @level, @xp);"
    );

    // If user doesn't have a profile, create one
    if (!stats) {
        // Set stats to default
        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10,
            maxmana : 150,
            businessID : 0,
            level : 1,
            xp : 0,
        }
        // Set stats to database
        setStats.run(stats);

        // Let the user know that he has created his profile
        message.channel.send(`You've just created your own profile!`)
        // Return a response with work
        return work(1);
    }

    // Create a function to level up if the user has enough xp
    function levelup() {
        const levelup = stats.level**3*50 + 100
        if (stats.xp >= levelup) {
            stats = {
                id : message.author.id,
                user : message.author.tag,
                money : stats.money + 50 * stats.level,
                mana : stats.mana,
                maxmana : stats.maxmana + 50,
                businessID : stats.businessID,
                level : stats.level + 1,
                xp : stats.xp - levelup,
            }
            setStats.run(stats)

            message.channel.send(`You've just leveled up to level ${stats.level}!`)
        }
    }

    // Create a function to work with a certain amount of mana
    function work(nbMana) {
        // Create a variable to store the work value
        workValue = Math.ceil(Math.random()*(10*stats.level - 4*stats.level) + 4*stats.level * nbMana);
        // Create a variable to store the xp value
        const getXp = Math.floor(workValue/4 * stats.level);

        stats = {
            id : message.author.id,
            user : message.author.tag,
            money : stats.money + workValue,
            mana : stats.mana - nbMana,
            maxmana : stats.maxmana,
            businessID : stats.businessID,
            level : stats.level,
            xp : stats.xp + getXp,
        }
        setStats.run(stats)

        // Call the levelup function
        levelup()

        // Send a message to the channel with the work value
        message.channel.send(`You have used ${nbMana} mana to work and made ${workValue}$ and gained ${getXp} xp!`)
    }

    // Check the user mana and if he has enough mana, work
    if (stats.mana>0) {
        if(!args[0]) { return work(1) }
        if (args[0] === 'all') { return work(stats.mana) }
        else if(args.length<=1) {
            if (stats.mana<=Number(args[0])) { work(stats.mana) }
            else if (stats.mana>Number(args[0])) { work(Number(args[0])) }
        }
    } else { return message.channel.send(`You've run out of mana!`) }

    // Check if the user has typed a number
    if (!Number(args[0]) && !(args[0] == 'all')) { return message.channel.send('You have to type a number!') }
};

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addIntegerOption(option =>
        option
            .setName('mana')
            .setDescription('The amount of mana you want to use to work')
            .setRequired(false))
    .setDMPermission(true)

// Create the run script for the interaction command
module.exports.run = async (client, interaction) => {
    // Get author user stats
    let stats = inv.prepare("SELECT * FROM stats WHERE id = ?;").get(interaction.member?.user.id ?? interaction.user.id);
    // Set stats to database
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, businessID, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @businessID, @level, @xp);"
    );

    // Check if the user has a profile
    if (!stats) {
        // Create a variable to store the stats
        stats = {
            id : interaction.member?.user.id ?? interaction.user.id,
            user : interaction.member?.user.tag ?? interaction.user.tag,
            money : 0,
            mana : 10,
            maxmana : 150,
            businessID : 0,
            level : 1,
            xp : 0,
        }
        // Set stats to database
        setStats.run(stats);

        // Let the user know that he has created his profile
        message.channel.send(`You've just created your own profile!`)
        // Return a response with work
        return work(1);
    }

    // Create a function to level up
    function levelup() {
        const levelup = stats.level**3*50 + 100
        if (stats.xp >= levelup) {
            setStats.run({
                id : interaction.member?.user.id ?? interaction.user.id,
                user : interaction.member?.user.tag ?? interaction.user.tag,
                money : stats.money,
                mana : stats.mana,
                maxmana : stats.maxmana + 50,
                businessID : stats.businessID,
                level : stats.level + 1,
                xp : stats.xp - levelup,
            })

            interaction.channel.send(`You've just leveled up to level ${stats.level + 1}!`);
        }
    }

    // Create a function to work with a certain amount of mana
    function work(nbMana) {
        // Create a variable to store the work value
        workValue = Math.ceil(Math.random()*(10*stats.level - 4*stats.level) + 4*stats.level * nbMana);
        // Create a variable to store the xp value
        const getXp = Math.floor(workValue/4 * stats.level);

        stats = {
            id : interaction.member?.user.id ?? interaction.user.id,
            user : interaction.member?.user.tag ?? interaction.user.tag,
            money : stats.money + workValue,
            mana : stats.mana - nbMana,
            maxmana : stats.maxmana,
            businessID : stats.businessID,
            level : stats.level,
            xp : stats.xp + getXp,
        };
        setStats.run(stats);

        // Call the levelup function
        levelup();

        // Send a message to the channel with the work value
        interaction.reply(`You have used ${nbMana} mana to work and made ${workValue}$ and gained ${getXp} xp!`);
    }

    // Check the user mana and if he has enough mana, work
    if (stats.mana > 0) {
        if(!interaction.options.getInteger('amount')) { return work(1) }
        if (stats.mana<=interaction.options.getInteger('amount')) { work(stats.mana) }
        else if (stats.mana>interaction.options.getInteger('amount')) { work(interaction.options.getInteger('amount')) }
    } else { return interaction.reply(`You've run out of mana!`) }
};