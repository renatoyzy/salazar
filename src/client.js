import Discord, { Client } from "discord.js";

const client = new Client({
    intents: [
        Discord.IntentsBitField.Flags.GuildExpressions,
        Discord.IntentsBitField.Flags.GuildIntegrations,
        Discord.IntentsBitField.Flags.GuildInvites,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildMessagePolls,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
        Discord.IntentsBitField.Flags.GuildMessageTyping,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildModeration,
        Discord.IntentsBitField.Flags.GuildPresences,
        Discord.IntentsBitField.Flags.GuildScheduledEvents,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.GuildWebhooks,
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.MessageContent,
        Discord.IntentsBitField.Flags.DirectMessages,
        Discord.IntentsBitField.Flags.AutoModerationConfiguration,
        Discord.IntentsBitField.Flags.AutoModerationExecution,
    ],
    partials: [
        Discord.Partials.Message,
        Discord.Partials.GuildMember,
        Discord.Partials.Reaction,
        Discord.Partials.Channel,
        Discord.Partials.ThreadMember,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent,
    ],
});

/**
 * Cliente do bot
 * @returns Cliente do bot
 */
export default client;