import { 
    Colors, 
    ButtonInteraction,
    MessageFlags,
    EmbedBuilder,
    PermissionsBitField,
    ChannelType
} from 'discord.js';
import * as Server from '../src/Server.js';
import { simplifyString } from "../src/StringUtils.js";
import { getAverageColor, makeRoundFlag, isImageSafe, fetchImageAsPngBuffer } from "../src/VisualUtils.js";
import gis from "g-i-s";
import { getCurrentDate } from '../src/Roleplay.js';

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({
            content: `Você não tem o cargo necessário para isso.`,
            flags: [MessageFlags.Ephemeral]
        });

        interaction.reply({
            content: `Você aprovou o jogador, que deverá receber suas permissões automaticamente.`,
            flags: [MessageFlags.Ephemeral]
        });

        const serverConfig = (await Server.config(interaction.guildId)).server;

        const unfilteredCountry = interaction.message.embeds[0].fields.find(f => f.name === '🎌 País solicitado')?.value;
        const country = simplifyString(unfilteredCountry);
        const player = await interaction.guild.members.fetch(interaction.message.embeds[0].fields.find(f => f.name === '👥 ID do jogador')?.value);

        // Busca todos os cargos de país baseados nos canais da categoria
        const countryCategory = await interaction.guild.channels.fetch(serverConfig?.channels?.country_category);
        const countryChannels = await countryCategory?.children?.cache;
        const countryRoleNames = countryChannels?.map(c => simplifyString(c.name)) || [];

        // Remove todos os cargos de país do usuário (que batem com os nomes dos canais)
        for (const role of player.roles.cache.values()) {
            const normalizedRoleName = simplifyString(role.name);
            if (countryRoleNames.includes(normalizedRoleName)) {
                await player.roles.remove(role.id).catch(() => {});
            }
        }

        // Busca o canal do país escolhido
        const countryChannel = countryChannels?.find(c => simplifyString(c.name).includes(country));

        // Adiciona o cargo do país escolhido
        const countryRole = interaction.guild.roles.cache.find(r => simplifyString(r.name).includes(country));

        if (countryRole) {
            await player.roles.add(countryRole).catch(() => {});

            if(!countryChannel) {
                // Se o canal não existir, cria um novo canal para o país
                await interaction.guild.channels.create({
                    name: unfilteredCountry.toLowerCase().replaceAll(' ', '-'),
                    type: ChannelType.GuildForum,
                    parent: serverConfig?.channels?.country_category,
                    permissionOverwrites: [
                        {
                            id: countryRole.id,
                            allow: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        }
                    ]
                });
            }
        } else {
            interaction.guild.roles.create({
                name: unfilteredCountry,
                permissions: new PermissionsBitField([]),
                reason: `Cargo criado automaticamente para o país ${country}`,
            }).then(async (role) => {
                await player.roles.add(role).catch(() => {});

                if(!countryChannel) {
                    // Se o canal não existir, cria um novo canal para o país
                    await interaction.guild.channels.create({
                        name: unfilteredCountry.toLowerCase().replaceAll(' ', '-'),
                        type: ChannelType.GuildForum,
                        parent: serverConfig?.channels?.country_category,
                        permissionOverwrites: [
                            {
                                id: role.id,
                                allow: [PermissionsBitField.Flags.ViewChannel],
                            },
                            {
                                id: interaction.guild.roles.everyone.id,
                                deny: [PermissionsBitField.Flags.ViewChannel],
                            }
                        ]
                    });

                    // Criar bandeira emoji
                    const serverRoleplayDate = getCurrentDate(interaction.guild);
                    
                    await gis(`Bandeira ${role.name} ${serverRoleplayDate}`, async (error, results) => {

                        const validResult = results[0];

                        if (!error && validResult?.url && isImageSafe(validResult.url)) {
                            
                            const buffer = await makeRoundFlag(await fetchImageAsPngBuffer(validResult.url));

                            interaction.guild.emojis.create({
                                name: `flag_${simplifyString(unfilteredCountry).replaceAll(' ', '')}`,
                                attachment: buffer
                            })
                            // Calcula e seta a cor média
                            try {
                                const avgColor = await getAverageColor(validResult.url);
                                avgColor && role.setColor(avgColor);
                            } catch (e) {}
                        }
                        
                    });
                }
            }).catch(() => {});
        }
        
        // Garante que o cargo de jogador seja adicionado
        if (serverConfig?.roles?.player && !player.roles.cache.has(serverConfig.roles.player)) {
            await player.roles.add(serverConfig.roles.player).catch(() => {});
        }

        // Atualiza o canal de países escolhidos
        const pickedCountriesChannel = await interaction.guild.channels.fetch(serverConfig?.channels?.picked_countries);
        if (pickedCountriesChannel && pickedCountriesChannel.isTextBased()) {
            // Busca todas as mensagens do canal
            const msgs = await pickedCountriesChannel.messages.fetch({ limit: 100 });
            const normalizedCountry = simplifyString(unfilteredCountry).toUpperCase();

            // Remove o jogador de outros países (edita as mensagens)
            for (const msg of msgs.values()) {
                if (!msg.editable) continue;
                // Procura menção ao jogador
                if (msg.content.includes(`<@${player.id}>`)) {
                    // Remove o jogador da lista
                    const lines = msg.content.split('\n');
                    const newLines = lines.filter(line => !line.includes(`<@${player.id}>`) || line.startsWith('##'));
                    // Se só sobrou o título, deleta a mensagem
                    if (newLines.length <= 1) {
                        await msg.delete().catch(() => {});
                    } else {
                        await msg.edit(newLines.join('\n')).catch(() => {});
                    }
                }
            }

            // Procura mensagem do país
            let countryMsg = msgs.find(msg =>
                msg.author.id === interaction.client.user.id &&
                simplifyString(msg.content.split('\n')[0]).toUpperCase().includes(normalizedCountry)
            );

            if (countryMsg) {
                // Adiciona o jogador à lista, se não estiver
                const lines = countryMsg.content.split('\n');
                const already = lines.some(line => line.includes(`<@${player.id}>`));
                if (!already) {
                    lines.push(`- <@${player.id}>`);
                    await countryMsg.edit(lines.join('\n')).catch(() => {});
                }
            } else {
                // Cria nova mensagem para o país
                await pickedCountriesChannel.send(`## ${unfilteredCountry.toUpperCase()}\n- <@${player.id}>`);
            }
        };
        
        let newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription("A escolha foi aprovada.")
        .setColor(Colors.Green)
        .setFields()
        .setFooter({
            text: `O(a) administrador(a) responsável foi ${interaction.member.displayName}.`
        });

        interaction.message.editable && interaction.message.edit({
            content: ``,
            embeds: [newEmbed],
            components: []
        });

        setTimeout(() => {
            interaction.message?.deletable && interaction.message.delete();
        }, 60_000);

        interaction.channel.send(`<@${player.id}>`).then(msg => msg.delete()).catch(() => {});
    }

}