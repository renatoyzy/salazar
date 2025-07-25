import { 
    ButtonInteraction,
    MessageFlags,
} from 'discord.js';
import { config } from '../src/server_info.js';
import { simplifyString } from '../src/string_functions.js';

const cooldownUsers = {};

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        const server_config = await config(interaction.guildId);

        if (!server_config?.server?.channels?.picked_countries) return;
        if(server_config?.server_tier<=2) return interaction.reply({content: 'Essa funcionalidade não está disponível no plano atual do servidor.', flags: [MessageFlags.Ephemeral]});

        const memberCountry = interaction.member.roles.cache.find(r => interaction.guild.channels.cache.find(c => c.parentId == server_config?.server?.channels?.country_category && simplifyString(r.name).includes(simplifyString(c.name))));

        try {

            const pickedCountriesChannel = await interaction.guild.channels.fetch(server_config.server.channels.picked_countries).catch(() => null);
            if (!pickedCountriesChannel || !pickedCountriesChannel.isTextBased()) return;

            const msgs = await pickedCountriesChannel.messages.fetch({ limit: 100 });
            for (const msg of msgs.values()) {
                if (!msg.editable) continue;
                if (msg.content.includes(`<@${interaction.member.id}>`)) {
                    await interaction.member.roles.remove(server_config?.server?.roles?.player);
                    await interaction.reply({content: 'Você deixou o seu país com sucesso. Se quiser pegar outro, ou ficar apenas espectando, a escolha é sua.', flags: [MessageFlags.Ephemeral]})
                    
                    if(memberCountry) interaction.member.roles.remove(memberCountry);

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
        } finally {
            if(!interaction.replied) await interaction.reply('Não achei nenhum país associado ao seu nome. Nada mudou')
        }

    }

}