import { 
    SlashCommandBuilder, 
    SlashCommandSubcommandBuilder, 
    SlashCommandAttachmentOption, 
    SlashCommandStringOption, 
    PermissionFlagsBits, 
    EmbedBuilder,
    CommandInteraction,
    MessageFlags,
    Colors
} from "discord.js";
import Canvas from "canvas";
import config from "../../src/config.js";

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
            .setDescription("Nome do emoji. Recomenda-se colocar um 'flag_' antes.")
            .setRequired(true)
        )
    ),

    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const server_config = await config(interaction.guildId);

        if(!server_config) return interaction.editReply({
            content: `Esse servidor não está configurado corretamente. Contate um administrador.`,
            flags: [MessageFlags.Ephemeral]
        });

        if(!server_config?.server_tier >= 2) return interaction.editReply({
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
                const canvas = Canvas.createCanvas(72 * 2, 52 * 2);
                const ctx = canvas.getContext('2d');
                const img = interaction.options.get("imagem").attachment;
                const imageObj = await Canvas.loadImage(img.url);

                // Desenhar retângulo arredondado
                const x = 0;
                const y = 0;
                const width = 72 * 2;
                const height = 52 * 2;
                const radius = 10 * 2;

                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();

                ctx.clip();
                ctx.drawImage(imageObj, x, y, width, height);

                const buffer = canvas.toBuffer("image/png");

                interaction.guild.emojis.create({
                    name: `flag_${interaction.options.get("nome").value}`,
                    attachment: buffer
                }).then(() => {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(Colors.Green)
                            .setTitle(`Emoji da bandeira de ${interaction.options.get("nome").value} adicionado!`)
                            .setImage(img.url)
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
