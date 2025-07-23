import { Guild } from "discord.js";
import { config } from "./server_info.js";

/**
 * Obtém o contexto do roleplay para um servidor específico.
 * @param {Guild} guild - Objeto guild do Discord
 * @returns {string | undefined} Contexto completo do roleplay 
 */
export async function GetContext(guild) {
    const server_config = await config(guild.id || guild);
    if (!server_config?.server?.channels?.context) return undefined;
    if (!guild.channels.cache.has(server_config.server.channels.context)) return undefined;
    
    return (await guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
        ?.sort()
        ?.map(msg => msg.content)
        ?.join('\n\n');
}