import { GuildMember } from "discord.js";
import * as Server from "../src/Server.js";
import { simplifyString } from "../src/StringUtils.js";

export default {
    name: 'guildMemberUpdate',

    /**
     * @param {GuildMember} oldMember 
     * @param {GuildMember} newMember 
     */
    async execute(oldMember, newMember) {
        if(oldMember.roles.cache == newMember.roles.cache) return;

        const serverConfig = await Server.config(newMember.guild.id);
        if (!serverConfig?.server?.channels?.picked_countries) return;

        // Busca todos os cargos de país
        const countryCategory = await newMember.guild.channels.fetch(serverConfig.server.channels.country_category).catch(() => null);
        const countryChannels = countryCategory?.children?.cache;
        const countryRoleNames = countryChannels?.map(c => simplifyString(c.name)) || [];

        // Identifica cargos de país removidos e adicionados
        const oldCountryRoles = [...oldMember.roles.cache.values()].filter(role => countryRoleNames.includes(simplifyString(role.name)));
        const newCountryRoles = [...newMember.roles.cache.values()].filter(role => countryRoleNames.includes(simplifyString(role.name)));

        // Removidos
        const removedRoles = oldCountryRoles.filter(role => !newCountryRoles.some(r => r.id === role.id));
        // Adicionados
        const addedRoles = newCountryRoles.filter(role => !oldCountryRoles.some(r => r.id === role.id));

        // Atualiza o canal de países escolhidos
        const pickedCountriesChannel = await newMember.guild.channels.fetch(serverConfig.server.channels.picked_countries).catch(() => null);
        if (!pickedCountriesChannel || !pickedCountriesChannel.isTextBased()) return;
        const msgs = await pickedCountriesChannel.messages.fetch({ limit: 100 });

        // Remover o membro das mensagens dos países removidos
        for (const role of removedRoles) {
            const normalizedCountry = simplifyString(role.name).toUpperCase();
            let countryMsg = msgs.find(msg =>
                msg.author.id === newMember.client.user.id &&
                simplifyString(msg.content.split('\n')[0]).toUpperCase().includes(normalizedCountry)
            );
            if (countryMsg && countryMsg.editable) {
                const lines = countryMsg.content.split('\n');
                const newLines = lines.filter(line => !line.includes(`<@${newMember.id}>`) || line.startsWith('##'));
                if (newLines.length <= 1) {
                    await countryMsg.delete().catch(() => {});
                } else {
                    await countryMsg.edit(newLines.join('\n')).catch(() => {});
                }
            }
        }

        // Adicionar o membro nas mensagens dos países adicionados
        for (const role of addedRoles) {
            const normalizedCountry = simplifyString(role.name).toUpperCase();
            let countryMsg = msgs.find(msg =>
                msg.author.id === newMember.client.user.id &&
                simplifyString(msg.content.split('\n')[0]).toUpperCase().includes(normalizedCountry)
            );
            if (countryMsg && countryMsg.editable) {
                const lines = countryMsg.content.split('\n');
                const already = lines.some(line => line.includes(`<@${newMember.id}>`));
                if (!already) {
                    lines.push(`- <@${newMember.id}>`);
                    await countryMsg.edit(lines.join('\n')).catch(() => {});
                }
            } else {
                await pickedCountriesChannel.send(`## ${role.name.toUpperCase()}\n- <@${newMember.id}>`);
            }
        }
    }
}