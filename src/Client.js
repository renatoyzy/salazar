import { 
    Client, 
    EmbedBuilder,
    Colors,
    IntentsBitField,
    Partials
} from "discord.js";

const client = new Client({
    intents: [
        IntentsBitField.Flags.GuildExpressions,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessagePolls,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessageTyping,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildScheduledEvents,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildWebhooks,
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.DirectMessages,
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
    ],
    partials: [
        Partials.Message,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.Channel,
        Partials.ThreadMember,
        Partials.User,
        Partials.GuildScheduledEvent,
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