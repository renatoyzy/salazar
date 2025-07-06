import Discord from "discord.js";
import Canvas from "canvas";
import config from "../../config.json" with { type: "json" };

export default {
    data: new Discord.SlashCommandBuilder()
        .setName("gerar")
        .setDescription("gerar")
        .addSubcommand(
            new Discord.SlashCommandSubcommandBuilder()
                .setName("bandeira")
                .setDescription("[Administrativo] Arredonda, escala e adiciona como emojis bandeiras de países.")
                .addAttachmentOption(
                    new Discord.SlashCommandAttachmentOption()
                        .setName("imagem")
                        .setDescription("Imagem da bandeira que será adicionada")
                        .setRequired(true)
                )
                .addStringOption(
                    new Discord.SlashCommandStringOption()
                        .setName("nome")
                        .setDescription("Nome do emoji. Recomenda-se colocar um 'flag_' antes.")
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!interaction.member.roles.cache.some(r => config.server.roles.narrador.includes(r.id))) {
            return interaction.reply({
                content: `Você precisa ser um administrador para utilizar esse comando.`,
                ephemeral: true
            });
        }

        if (interaction.options.getSubcommand() === "bandeira") {
            if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    content: `Você precisa ser um administrador para utilizar esse comando.`,
                    ephemeral: true
                });
            }

            interaction.reply({
                embeds: [new Discord.EmbedBuilder().setColor("Greyple").setDescription(`Carregando...`)]
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
                }).then(emo => {
                    interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor("Green")
                                .setTitle(`Emoji da bandeira de ${interaction.options.get("nome").value} adicionado!`)
                                .setImage(img.url)
                        ]
                    }).catch(() => {});
                }).catch(err => {
                    interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`**Erro:** ${err}`)
                        ]
                    });
                });
            });
        }
    }
};
