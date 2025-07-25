import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    ModalBuilder,
    PermissionsBitField,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import { config } from "../src/server_info.js";
import { simplifyString } from "../src/string_functions.js";

export default {

    /**
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {

        const selected = interaction.values[0];
        const server_config = await config(interaction.guildId);

        if (selected === "outro") {
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId('country_pick_custom')
                .setTitle('Escolha outro país')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId('country_input')
                        .setLabel('Digite o nome do país')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Exemplo: Quinta República Francesa...')
                        .setRequired(true)
                    )
                )
            );

        } else {
            const selected_channel = await interaction.guild.channels.fetch(selected);

            await interaction.update({ content: `Você pediu ${selected_channel.name}! Agora é só aguardar a resposta da administração.`, components: [] });
            
            const unfiltered_country = selected_channel.name.replaceAll('-', ' ').toUpperCase();
            const country = simplifyString(unfiltered_country);
            if (!country) return;

            const countryCategory = interaction.guild.channels.cache.get(server_config?.server?.channels?.country_category);
            
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
            !existingChannel && !existingRole && replyEmbed.addFields([{ name: '⚠️ Nota para o administrador', value: `Nenhum canal ou cargo para o país **${country}** foi encontrado. Um novo canal e cargo serão criados se você escolher Permitir. Se você acredita que isso é um erro, por favor, prefira setar manualmente, e adicione o cargo existente a(o) jogador(a).` }]);
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

    }

}