const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { admin } = require('../../settings.json');
const db = require("better-sqlite3");
const inv = new db('./database/economy/stats.sqlite');
const bus = new db('./database/economy/business.sqlite');

// Create the json script for the help command
module.exports.help = {
    name: "inventory",
    description: 'See your Inventory!',
    aliases: ['me','balance','inv','profile','p','stats'],
    usage: '< none | player >',
    parameters: '<tag>'
};

// Create a the run script for the command
module.exports.execute = async (client, message, args) => {

    // Creation of a function to capitalize the first letter of a string
    const makeName = (name) => name.toLowerCase().charAt(0).toUpperCase() + name.toLowerCase().slice(1);

    // Get user stats function
    const getStats = inv.prepare("SELECT * FROM stats WHERE id = ?");
    // Set user stats function
    const setStats = inv.prepare(
        "INSERT OR REPLACE INTO stats (id, user, money, mana, maxmana, businessID, level, xp) VALUES (@id, @user, @money, @mana, @maxmana, @businessID, @level, @xp);"
    );
    // Get business function
    const getBusiness = bus.prepare("SELECT id, business FROM business WHERE id = ?");

    // Get author user stats
    let playerStats = getStats.get(message.author.id);
    // Update author usertag in stats
    inv.prepare(`UPDATE stats SET user = '${message.author.tag}' WHERE id = ${message.author.id}`).run();
    
    // If user doesn't have a profile, create one
    if (!playerStats) {
        playerStats = {
            id : message.author.id,
            user : message.author.tag,
            money : 0,
            mana : 10,
            maxmana : 150,
            businessID : 0,
            level : 1,
            xp : 0,
        }
        setStats.run(playerStats);

        message.channel.send(`You've just created your own profile!`)
    }

    // If user has a profile, continue
    switch(args[0]) {
        // Case if admin wants to edit an inventory
        case 'edit':
        case 'change':
        case 'set':
            // Check if user is admin
            if (message.author.id !== admin) return;

            // Check if user has specified a user id, a old value to change and the newer one
            if (args.length <= 3)
            return message.reply({ content: 'You need to specify a user id, a old value to change and the newer one!', allowedMentions: { repliedUser: false } });
            // Return if user wants to change the id
            if (args[2] === 'id')
            return message.reply({ content: 'You can\'t change the id of a user!', allowedMentions: { repliedUser: false } });
            // Return if user wants to change the username
            if (args[2] === 'user')
            return message.reply({ content: 'You can\'t change the username of a user!', allowedMentions: { repliedUser: false } });

            // Get user object if it is an ID or a tag
            let getUserToEdit;
            if (message.mentions.users.first()) {
                getUserToEdit = message.mentions.users.first().id;
            } else {
                if (args[1].match(/([0-9]*)/)) {
                    getUserToEdit = args[1].match(/([0-9]*)/)[0];
                }
            }

            // Get User object in database
            const getPlayerStats = getStats.get(getUserToEdit);

            // Return if user doesn't have a profile
            if (!getPlayerStats)
            return message.reply({ content: 'This user doesn\'t have a profile!', allowedMentions: { repliedUser: false } });

            // Switch case to change the value
            switch(args[2]) {
                case 'money':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET money = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the money of ${getPlayerStats.user} to ${args[3]}`, allowedMentions: { repliedUser: false } });
                    break;

                case 'mana':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET mana = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the mana of ${getPlayerStats.user} to ${args[3]} mana`, allowedMentions: { repliedUser: false } });
                    break;

                case 'maxmana':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET maxmana = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the max mana of ${getPlayerStats.user} to ${args[3]} max mana`, allowedMentions: { repliedUser: false } });
                    break;

                case 'businessID':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET businessID = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the business ID of ${getPlayerStats.user} to ${args[3]}`, allowedMentions: { repliedUser: false } });
                    break;

                case 'level':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET level = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the level of ${getPlayerStats.user} to ${args[3]}`, allowedMentions: { repliedUser: false } });
                    break;

                case 'xp':
                    if (!Number(args[3]))
                    return message.reply({ content: 'You need to specify a number!', allowedMentions: { repliedUser: false } });

                    inv.prepare("UPDATE stats SET xp = ? WHERE user = ?").run(args[3], getPlayerStats.user);

                    message.reply({ content: `You've changed the xp of ${getPlayerStats.user} to ${args[3]}`, allowedMentions: { repliedUser: false } });
                    break;

                default:
                    message.reply({ content: 'You need to specify a valid option!', allowedMentions: { repliedUser: false } });
                    break;
            }

            break;
        case 'drop':
        case 'delete':
        case 'remove':
            // Check if user is admin
            if (message.author.id !== admin) return;

            // Check if user has specified a user id
            if (args.length <= 1)
            return message.reply({ content: 'You need to specify a user id!', allowedMentions: { repliedUser: false } });

            // Get user object if it is an ID or a tag
            let getUserToDrop;
            if (message.mentions.users.first()) {
                getUserToDrop = message.mentions.users.first().id;
            } else {
                if (args[1].match(/([0-9]*)/)) {
                    getUserToDrop = args[1].match(/([0-9]*)/)[0];
                }
            }

            // Get User object in database
            const getPlayerStatsToDrop = getStats.get(getUserToDrop);

            // Return if user doesn't have a profile
            if (!getPlayerStatsToDrop)
            return message.reply({ content: 'This user doesn\'t have a profile!', allowedMentions: { repliedUser: false } });

            // Drop the user
            inv.prepare("DELETE FROM stats WHERE user = ?").run(getPlayerStatsToDrop.user);

            // Reply to the user
            message.reply({
                content: `You've dropped ${getPlayerStatsToDrop.user.split('#')[0]}'s invetory from the database!`,
                allowedMentions: { repliedUser: false }
            });
            break;

        case undefined:
        case null:
            // Get business object from player's business ID
            let getJobObject = getBusiness.get(playerStats.businessID.toString());
            if (playerStats.businessID == 0) {
                getJobObject = { business: 'None' }
            }

            // Construct the embed to show the user's inventory
            const getPlayerInventory = new EmbedBuilder()
                .setColor(Math.floor(Math.random() * 16777214) + 1)
                .setTitle(message.author.username + '\'s Inventory')
                .setThumbnail(message.author.displayAvatarURL({ dynamic : true }))
                .addFields(
                    { name: "Money", value: `${playerStats.money} $`, inline: true },
                    { name: 'Energy', value: `${playerStats.mana} mana / ${playerStats.maxmana}`, inline: true},
                    { name: 'Business', value: `${makeName(getJobObject.business)}`, inline: false},
                    { name: 'Level', value: `${playerStats.level}`, inline: true},
                    { name: 'XP', value: `${playerStats.xp}`, inline: true}
                )
                .setTimestamp()
                .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})

            // Send the embed
            message.reply({
                embeds: [getPlayerInventory],
                allowedMentions: { repliedUser: false }
            })
            break;

        default:
            // Check if the user is a player or not from ID or mention
            if (message.mentions.users.first()) {
                // Get the user's tag object from the mention
                const getMentionTag = message.mentions.users.first();
                // Get the user's stats from the database
                const getStrangerbyTag = getStats.get(getMentionTag.id)

                // Check if the user is a player or not
                if (!getStrangerbyTag)
                return message.reply({
                    content: 'This user doesn\'t have a profile!',
                    allowedMentions: { repliedUser: false }
                });

                // Get business object from guy's business ID
                let getJobObjectForTag = getBusiness.get(getStrangerbyTag.businessID.toString());
                if (getStrangerbyTag.businessID == 0) {
                    getJobObjectForTag = { business: 'None' }
                }

                // Construct the embed to show the user's inventory
                const getUserTagEmbed = new EmbedBuilder()
                    .setColor(Math.floor(Math.random() * 16777214) + 1)
                    .setTitle(getMentionTag.username + '\'s Inventory')
                    .setThumbnail(getMentionTag.displayAvatarURL({ dynamic : true }))
                    .addFields(
                        { name: "Money", value: `${getStrangerbyTag.money} $`, inline: true },
                        { name: 'Energy', value: `${getStrangerbyTag.mana} mana / ${getStrangerbyTag.maxmana}`, inline: true},
                        { name: 'Business', value: `${makeName(getJobObjectForTag.business)}`, inline: false},
                        { name: 'Level', value: `${getStrangerbyTag.level}`, inline: true},
                        { name: 'XP', value: `${getStrangerbyTag.xp}`, inline: true}
                    )
                    .setTimestamp()
                    .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                
                // Send the embed
                return message.reply({
                    embeds: [getUserTagEmbed],
                    allowedMentions: { repliedUser: false }
                })
                    
            } else {
                // Get the user's stats from the database
                if (args[0].match(/([0-9]*)/)) {
                    // Get the user's ID from the mention
                    const getMentionId = args[0].match(/([0-9]*)/);
                    // Get the user's stats from the database
                    const getStrangerbyId = getStats.get(getMentionId[1]);

                    // Check if the user is a player or not
                    if (!getStrangerbyId) return message.channel.send('This user is not a player!')

                    // Get business object from player's business ID
                    let getJobObjectForID = getBusiness.get(getStrangerbyId.businessID.toString());
                    if (getStrangerbyId.businessID == 0) {
                        getJobObjectForID = { business: 'None' }
                    }

                    // Construct the embed to show the user's inventory
                    const getUserIdEmbed = new EmbedBuilder()
                        .setColor(Math.floor(Math.random() * 16777214) + 1)
                        .setTitle(getStrangerbyId.user.split('#')[0] + '\'s Inventory')
                        .setThumbnail(client.user.displayAvatarURL({ dynamic : true }))
                        .addFields(
                            { name: "Money", value: `${getStrangerbyId.money} $`, inline: true },
                            { name: 'Energy', value: `${getStrangerbyId.mana} mana / ${getStrangerbyId.maxmana}`, inline: true},
                            { name: 'Business', value: `${makeName(getJobObjectForID.business)}`, inline: false},
                            { name: 'Level', value: `${getStrangerbyId.level}`, inline: true},
                            { name: 'XP', value: `${getStrangerbyId.xp}`, inline: true}
                        )
                        .setTimestamp()
                        .setFooter({ text :`Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                        
                    // Send the embed
                    return message.reply({
                        embeds: [getUserIdEmbed],
                        allowedMentions: { repliedUser: false }
                    })
                }
            }
            break;
    }
};

// Create the json script for the interaction command
module.exports.data = new SlashCommandBuilder()
    .setName(module.exports.help.name)
    .setDescription(module.exports.help.description)
    .addStringOption(option =>
        option
            .setName('player')
            .setDescription('The player you want to see the inventory of'))
    .setDMPermission(true)

// Create the run script for the interaction command
module.exports.run = async (client, interaction) => {
    interaction.reply({ content: "This command is not yet available!", ephemeral: true })
};