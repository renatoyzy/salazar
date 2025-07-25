import { GuildMember } from "discord.js";
import * as Server from "../src/Server.js";

export default {
    name: 'guildMemberRemove',
    
    /**
     * @param {GuildMember} member 
     */
    async execute(member) {
        // Remove o jogador da lista de players do país no canal de países escolhidos
        try {
            // Busca configuração do servidor
            const serverConfig = await Server.config(member.guild.id);
            if (!serverConfig?.server?.channels?.picked_countries) return;

            const pickedCountriesChannel = await member.guild.channels.fetch(serverConfig.server.channels.picked_countries).catch(() => null);
            if (!pickedCountriesChannel || !pickedCountriesChannel.isTextBased()) return;

            const msgs = await pickedCountriesChannel.messages.fetch({ limit: 100 });
            for (const msg of msgs.values()) {
                if (!msg.editable) continue;
                if (msg.content.includes(`<@${member.id}>`)) {
                    const lines = msg.content.split('\n');
                    const newLines = lines.filter(line => !line.includes(`<@${member.id}>`) || line.startsWith('##'));
                    if (newLines.length <= 1) {
                        await msg.delete().catch(() => {});
                    } else {
                        await msg.edit(newLines.join('\n')).catch(() => {});
                    }
                }
            }
        } catch (err) {
            console.error('Erro ao remover player da lista de país ao sair:', err);
        }
    }
}