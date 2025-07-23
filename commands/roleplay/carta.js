import {
    AutocompleteInteraction,
    ChannelType,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    SlashCommandAttachmentOption,
    SlashCommandBuilder,
    SlashCommandStringOption
} from "discord.js";
import { config } from "../../src/server_info.js";
import bot_config from "../../config.json" with { type: "json" };
import { simplifyString } from "../../src/string_functions.js";
import gis from "g-i-s";
import { getAverageColor, isImageSafe } from "../../src/visual_functions.js";

export default {
    data: new SlashCommandBuilder()
        .setName("carta")
        .setDescription("Cria uma carta de roleplay para o jogador")
        .addStringOption(
            new SlashCommandStringOption()
            .setName('pais')
            .setDescription('O país destinatário que receberá a carta')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
            .setName("conteudo")
            .setDescription("O conteúdo da carta")
            .setRequired(true)
        )
        .addAttachmentOption(
            new SlashCommandAttachmentOption()
            .setName('imagem')
            .setRequired(false)
            .setDescription('Anexe uma imagem à carta se quiser')
        ),

    min_tier: 1,
    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
        const server_config = config(interaction.guildId);
        if(!interaction.member.roles.cache.has((await server_config)?.server?.roles?.player)) return interaction.editReply(`Este comando é restrito para jogadores do RP (<@&${(await server_config)?.server?.roles?.player}>).`);
        if((interaction.channel.parentId != (await server_config)?.server?.channels?.country_category) && interaction.channel.parent.parentId != (await server_config)?.server?.channels?.country_category) return interaction.editReply(`Esse comando só pode ser usado no seu chat privado do país.`);

        const countryChat = interaction.guild.channels.cache.find(c => simplifyString(c.name).includes(simplifyString(interaction.options.get('pais').value)));
        if(!countryChat) return interaction.editReply("Não encontrei o chat desse país.")

        const senderName = interaction.guild.roles.cache.find(r => simplifyString(r.name).includes(simplifyString(interaction.channel.parent.name)) || simplifyString(r.name).includes(simplifyString(interaction.channel.name))).name;
        const servidor_data_roleplay = (await (await interaction.guild.channels.fetch((await server_config)?.server?.channels?.time)).messages.fetch()).first() || 'antiga';

        await gis(`Bandeira ${senderName} ${servidor_data_roleplay}`, async (error, results) => {

            const responseContent = `@here`;
            let responseEmbed = new EmbedBuilder()
            .setTitle(`Carta enviada por ${senderName}`)
            .setDescription(interaction.options.get('conteudo').value);

            if (!error && results[0]?.url && isImageSafe(results[0].url)) {
                responseEmbed.setThumbnail(results[0].url);
                // Calcula e seta a cor média
                try {
                    const avgColor = await getAverageColor(results[0].url);
                    responseEmbed.setColor(avgColor);
                } catch (e) {
                    responseEmbed.setColor(Colors.Blue); // fallback
                }
            }

            if(interaction.options.getAttachment('imagem') && isImageSafe(interaction.options.getAttachment('imagem').url) && interaction.options.getAttachment('imagem').contentType.startsWith('image')) responseEmbed.setImage(interaction.options.getAttachment('imagem').url);

            try {
                if(countryChat.type === ChannelType.GuildForum) {
                    if(countryChat.threads.cache.find(t => t.name.toLowerCase().includes('caixa de entrada'))) {
                        countryChat.threads.cache.find(t => t.name.toLowerCase().includes('caixa de entrada')).send({content: responseContent, embeds: [responseEmbed]})
                    } else {
                        countryChat.threads.create({
                            name: `Caixa de Entrada`,
                            message: `Canal destinado à caixa de entrada de cartas enviadas através do comando do ${bot_config.name}`
                        }).then(inbox => {
                            inbox.send(`-# <@&${interaction.guild.roles.cache.find(r => simplifyString(r.name).includes(simplifyString(countryChat.name))).id}>`);
                            inbox.send({content: responseContent, embeds: [responseEmbed]});
                        })
                    }
                } else if(countryChat.isTextBased()) {
                    countryChat.send({content: responseContent, embeds: [responseEmbed]})
                };

                interaction.editReply({embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('Carta enviada com sucesso!')
                    .setDescription(`Sua carta foi enviada para ${countryChat.name.replaceAll('-', ' ').toUpperCase()}`)
                ]});
            } catch (error) {
                interaction.editReply({embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("Ocorreu um erro ao tentar enviar a carta.")
                    .setDescription(`${error.message || 'Erro desconhecido.'}`)
                ]});
            }
        });
    },

    /**
     * @param {AutocompleteInteraction} interaction
     */
    async autocomplete(interaction) {
        const server_config = config(interaction.guildId);
        const focusedOption = interaction.options.getFocused(true);
		let choices;

        switch (focusedOption.name) {
            case 'pais':
                choices = interaction.guild.channels.cache.get((await server_config)?.server?.channels?.country_category).children.cache.map(c => c.name).slice(0, 25)
                break;
        
            default:
                break;
        }

		const filtered = choices.filter(choice => choice.includes(focusedOption.value.toLowerCase().replaceAll(' ', '-')));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
    }
}