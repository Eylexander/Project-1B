const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits, ChannelType } = require('discord.js');
const guilds = require('../../game/guilds');
const { Card, payload } = require('../../ui/card');
const theme = require('../../ui/theme');

const onOff = (value) => (value ? '🟢 On' : '⚪ Off');
const channel = (id) => (id ? `<#${id}>` : 'any channel');

function settingsCard(settings, banner) {
    return new Card({ title: 'Server settings', emoji: '🛠️', subtitle: settings.name ?? undefined, color: theme.info })
        .text(banner ?? null)
        .lines([
            `💬 **Chat rewards** ${onOff(settings.chat_rewards)} · players earn a little money and XP for chatting (once a minute)`,
            `🏝️ **Treasure drops** ${onOff(settings.drops)} · chests wash up in ${channel(settings.drop_channel_id)}, first click wins`,
            `📣 **Announcements** ${settings.announce_channel_id ? `<#${settings.announce_channel_id}>` : '⚪ Off'} · lottery winners, Golden Hours, market news, prestiges, weekly Forbes list`,
            `💙 **Safety message** ${onOff(settings.safety)} · shows helplines when someone mentions suicide`,
            `🥔 **Fun replies** ${onOff(settings.fun_replies)} · the v1 bot's random French replies to trigger words`,
        ])
        .footer('Change with /config <setting>');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure Project 1B for this server.')
        .addSubcommand((s) => s.setName('view').setDescription('Show the current settings.'))
        .addSubcommand((s) => s.setName('chat-rewards').setDescription('Money and XP for chatting.')
            .addBooleanOption((o) => o.setName('enabled').setDescription('On or off').setRequired(true)))
        .addSubcommand((s) => s.setName('drops').setDescription('Treasure chests that appear in chat.')
            .addBooleanOption((o) => o.setName('enabled').setDescription('On or off').setRequired(true))
            .addChannelOption((o) => o.setName('channel').setDescription('Only drop in this channel (empty = anywhere)').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand((s) => s.setName('announcements').setDescription('Where to post big moments.')
            .addChannelOption((o) => o.setName('channel').setDescription('Leave empty to turn announcements off').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
        .addSubcommand((s) => s.setName('safety').setDescription('The suicide-prevention helpline message.')
            .addBooleanOption((o) => o.setName('enabled').setDescription('On or off').setRequired(true)))
        .addSubcommand((s) => s.setName('fun-replies').setDescription('Silly replies to trigger words.')
            .addBooleanOption((o) => o.setName('enabled').setDescription('On or off').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();
        let settings = guilds.settings(guildId, interaction.guild?.name);
        let banner = null;
        const enabled = interaction.options.getBoolean('enabled');

        if (sub === 'chat-rewards') settings = guilds.update(guildId, 'chat_rewards', enabled ? 1 : 0);
        if (sub === 'safety') settings = guilds.update(guildId, 'safety', enabled ? 1 : 0);
        if (sub === 'fun-replies') settings = guilds.update(guildId, 'fun_replies', enabled ? 1 : 0);
        if (sub === 'drops') {
            guilds.update(guildId, 'drops', enabled ? 1 : 0);
            settings = guilds.update(guildId, 'drop_channel_id', interaction.options.getChannel('channel')?.id ?? null);
        }
        if (sub === 'announcements') settings = guilds.update(guildId, 'announce_channel_id', interaction.options.getChannel('channel')?.id ?? null);
        if (sub !== 'view') banner = '✅ Saved.';

        await interaction.reply(payload(settingsCard(settings, banner), { ephemeral: true }));
    },
};
