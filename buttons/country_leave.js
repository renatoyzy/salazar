import { 
    ActionRowBuilder,
    ButtonInteraction,
    ChannelType,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import { config } from '../src/server_info.js';

const cooldownUsers = {};

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        const server_config = await config(interaction.guildId);

        if (!server_config?.server?.channels?.picked_countries) return;
        if(server_config?.server_tier<=2) return interaction.reply({content: 'Essa funcionalidade não está disponível no plano atual do servidor.', flags: [MessageFlags.Ephemeral]});
        if(!interaction.member.roles.cache.has(server_config?.server?.roles?.player)) return interaction.reply({content: 'Você não possui o cargo de jogador.', flags: [MessageFlags.Ephemeral]})

        try {

            const pickedCountriesChannel = await interaction.guild.channels.fetch(server_config.server.channels.picked_countries).catch(() => null);
            if (!pickedCountriesChannel || !pickedCountriesChannel.isTextBased()) return;

            const msgs = await pickedCountriesChannel.messages.fetch({ limit: 100 });
            for (const msg of msgs.values()) {
                if (!msg.editable) continue;
                if (msg.content.includes(`<@${interaction.member.id}>`)) {
                    const lines = msg.content.split('\n');
                    const newLines = lines.filter(line => !line.includes(`<@${interaction.member.id}>`) || line.startsWith('##'));
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