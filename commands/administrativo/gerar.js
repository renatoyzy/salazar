import { 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    SlashCommandAttachmentOption, 
    SlashCommandStringOption, 
    PermissionFlagsBits, 
    EmbedBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    Colors
} from "discord.js";
import Canvas from "canvas";
import * as Server from "../../src/Server.js";
import { makeRoundFlag, isImageSafe } from "../../src/VisualUtils.js";
import { simplifyString } from "../../src/StringUtils.js";

export default {

    data: new SlashCommandBuilder()
    .setName("gerar")
    .setDescription("gerar")
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("bandeira")
        .setDescription("[Administrativo] Arredonda, escala e adiciona como emojis bandeiras de países.")
        .addAttachmentOption(
            new SlashCommandAttachmentOption()
            .setName("imagem")
            .setDescription("Imagem da bandeira que será adicionada")
            .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
            .setName("nome")
            .setDescription("Nome do país ou entidade representada.")
            .setRequired(true)
        )
    ),

    min_tier: 2,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const serverConfig = await Server.config(interaction.guildId);

        if(!serverConfig) return interaction.editReply({
            content: `Esse servidor não está configurado corretamente. Contate um administrador.`,
            flags: [MessageFlags.Ephemeral]
        });

        if(!serverConfig?.server_tier >= 2) return interaction.editReply({
            content: `Este servidor não possui o tier necessário para usar esse comando.`,
            flags: [MessageFlags.Ephemeral]
        });

        if (interaction.options.getSubcommand() === "bandeira") {
            if (!interaction.member.permissions.has(PermissionFlagsBits.CreateGuildExpressions)) {
                return interaction.editReply({
                    content: `Você precisa ser um administrador para utilizar esse comando.`,
                    flags: [MessageFlags.Ephemeral]
                });
            }

            interaction.editReply({
                embeds: [new EmbedBuilder().setColor(Colors.Greyple).setDescription(`Carregando...`)]
            }).then(async () => {

                const imageUrl = interaction.options.getAttachment('imagem').url;
                if (!isImageSafe(imageUrl)) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setDescription(`Imagem bloqueada: conteúdo impróprio ou símbolo de ódio detectado.`)
                        ]
                    });
                }

                const buffer = await makeRoundFlag(interaction.options.getAttachment('imagem').url);

                interaction.guild.emojis.create({
                    name: `flag_${simplifyString(interaction.options.get("nome").value).replaceAll(' ', '')}`,
                    attachment: buffer
                }).then(() => {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Green)
                            .setTitle(`Emoji da bandeira de ${interaction.options.get("nome").value} adicionado!`)
                            .setImage(interaction.options.getAttachment('imagem').url)
                        ]
                    }).catch(() => {});
                }).catch(err => {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setDescription(`**Erro:** ${err}`)
                        ]
                    });
                });
            });
        }
    }
};
