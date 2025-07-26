import {
    ActionRowBuilder,
    BaseInteraction,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    Guild,
    MessageFlags,
    PermissionsBitField
} from "discord.js";
import * as Server from "./Server.js";
import { simplifyString } from "./StringUtils.js";

/**
 * Obtém o contexto do roleplay para um servidor específico.
 * @param {Guild} guild - Objeto guild do Discord
 * @returns {Promise<string | undefined>} Contexto completo do roleplay 
 */
export async function getContext(guild) {
    if (typeof guild !== "object") throw new Error("A guild deve ser um objeto de servidor.");

    const serverConfig = await Server.config(guild.id);
    if (!serverConfig?.server?.channels?.context) return undefined;
    if (!guild.channels.cache.has(serverConfig.server.channels.context)) return undefined;
    
    return (await guild.channels.cache.get(serverConfig?.server?.channels?.context)?.messages?.fetch())
        ?.sort()
        ?.map(msg => msg.content.split('\n').filter(line => !line.includes('-# RG-')).join('\n'))
        ?.join('\n\n');
}

/**
 * Diálogo de pegar um país
 * @param {string} selectedCountry 
 * @param {BaseInteraction} interaction 
 */
export async function countryPickDialog(selectedCountry, interaction) {

    const responseText = `Você pediu ${selectedCountry}! Agora é só aguardar a resposta da administração.`
    interaction.isModalSubmit() ? 
        await interaction.reply({ content: responseText, flags: [MessageFlags.Ephemeral] })
    : 
        await interaction.update({ content: responseText, components: [] });
    
    const unfiltered_country = selectedCountry.replaceAll('-', ' ').toUpperCase();
    const country = simplifyString(unfiltered_country);
    if (!country) return;

    const serverConfig = await Server.config(interaction.guildId);
    const countryCategory = interaction.guild.channels.cache.get(serverConfig?.server?.channels?.country_category);
    
    const existingChannel = countryCategory?.children?.cache.find(c => simplifyString(c.name).includes(country));
    const existingRole = interaction.guild.roles.cache.find(r => simplifyString(r.name).includes(country));
    
    let replyEmbed = new EmbedBuilder()
    .setColor(Colors.Yellow)
    .setTitle(`${interaction.member.user.displayName} escolheu o país "${unfiltered_country}"`)
    .setFooter({text: "Aguarde ou peça para que algum administrador aprove ou não a sua escolha."})
    .addFields([
        { name: '🎌 País solicitado', value: unfiltered_country, inline: true },
        { name: '👥 ID do jogador', value: interaction.user.id, inline: true }
    ]);

    existingChannel && existingRole && replyEmbed.addFields([{ name: '⚠️ Tudo certo, administrador!', value: `Aparentemente o país já tem um cargo e canal, que serão setados se escolher Permitir. Administrador, apenas verifique se o país escolhido já não tem dono(a).` }]);
    existingChannel && !existingRole && replyEmbed.addFields([{ name: '⚠️ País possui apenas canal', value: `O canal para o país **${country}** existe (<@&${existingRole.id}>) **mas ele não tem um cargo!** Se acredita que isso é um erro, prefira setar manualmente.` }]);
    !existingChannel && existingRole && replyEmbed.addFields([{ name: '⚠️ País possui apenas cargo', value: `O cargo para o país **${country}** existe (<@&${existingRole.id}>) **mas ele não tem um canal, ou a categoria de países não está configurada corretamente!** Se acredita que isso é um erro, prefira setar manualmente.` }]);
    !existingChannel && !existingRole && replyEmbed.addFields([{ name: '⚠️ Nota para o administrador', value: `Nenhum canal ou cargo para o país **${country}** foi encontrado. Um novo canal e cargo serão criados **automaticamente** se você escolher Permitir. Se você acredita que isso é um erro, por favor, prefira setar manualmente, e adicione o cargo existente a(o) jogador(a).` }]);
    existingRole && existingRole.members.size>0 && replyEmbed.addFields([{name: '⚠️ País já tem dono!', value: `O(s) jogador(es) <@${existingRole?.members?.map(member => member.id).join('> <@')}> já têm o cargo desse país. Confira se o coop foi consentido.`}])

    interaction.channel.send({
        content: process.env.MAINTENANCE ? `-# pings vão aqui` : `-# <@&${interaction.guild.roles.cache.filter(r => !r.managed && !r.name.toLowerCase().includes('bot') && r.permissions.has(PermissionsBitField.Flags.ManageRoles)).map(r => r.id).join('> <@&')}>`,
        embeds: [replyEmbed],
        components: [
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId('country_pick_deny')
                .setLabel(`Não permitir`)
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId('country_pick_manual')
                .setLabel(`Vou setar manualmente`)
                .setStyle(ButtonStyle.Secondary)
            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId('country_pick_allow')
                .setLabel(`Permitir`)
                .setStyle(ButtonStyle.Success)
            )
        ]
    });
}