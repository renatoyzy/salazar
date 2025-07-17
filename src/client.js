import Discord, { 
    Client, 
    EmbedBuilder,
    Colors 
} from "discord.js";

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

/**
 * Envia uma mensagem de anúncio para todos os servidores do bot
 * @param {Object} properties
 * @param {string} properties.title Título da mensagem
 * @param {string} properties.message Mensagem a ser enviada 
 */
export function announce({
    title = 'Anúncio do Bot',
    message,
    description,
    color = Colors.Green,
}) {
    const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(message || description || "Nenhuma mensagem foi definida.");

    client.guilds.cache.forEach(async (guild) => {
        if (guild.systemChannel) { 
            guild.systemChannel.send({ embeds: [embed] }) 
        } else if (guild.publicUpdatesChannel) { 
            guild.publicUpdatesChannel.send({ embeds: [embed] }) 
        } else { 
            try { 
                (await guild.fetchOwner()).user.send({ 
                    embeds: [
                        embed.setFooter(`Se você, dono(a) do ${guild.name} não quiser mais receber notificações assim no seu privado, por favor defina um canal do sistema ou um canal de atualizações públicas no seu servidor.`)
                    ] 
                }) 
            } catch (err) { } 
        } 
    })
}