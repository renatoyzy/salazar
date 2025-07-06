const Discord = require("discord.js");
const Canvas = require('canvas');
const config = require("../../config.json");

module.exports = {

    data: new Discord.SlashCommandBuilder()
    .setName("gerar")
    .setDescription("gerar")
    .addSubcommand( // bandeira
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
        ),
    ),

    async execute(interaction) {

        if(!interaction.member.roles.cache.some(r => config.server.roles.narrador.includes(r.id))) return interaction.reply({content:`Você precisa ser um administrador para utilizar esse comando.`,ephemeral:true}) 
        if(interaction.options.getSubcommand() === "bandeira") {
            if(!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply({content:`Você precisa ser um administrador para utilizar esse comando.`,ephemeral:true});
            interaction.reply({embeds: [new Discord.EmbedBuilder().setColor("Greyple").setDescription(`Carregando...`)]}).then(async () => {

                const canvas = Canvas.createCanvas(72*2, 52*2)
                const ctx = canvas.getContext('2d');
                let img = interaction.options.get("imagem").attachment;
                let imagin = Canvas.loadImage(img.url);

                // draw a rounded rectangle

                let x = 0;
                let y = 0;
                let width = 72*2;
                let height = 52*2;
                let radius = 10*2;
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

                ctx.drawImage((await imagin),x,y,width,height);

                const imagem = new Discord.AttachmentBuilder(canvas.toBuffer(), "image.png");

                interaction.guild.emojis.create({
                    name: `flag_${interaction.options.get("nome").value}`,
                    attachment: imagem.attachment
                }).catch((err) => {

                    interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`**Erro:** ${err}`)
                        ]
                    });

                }).then((emo) => {

                    interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setColor("Green")
                            .setTitle(`Emoji da bandeira de ${interaction.options.get("nome").value} adicionado!`)
                            .setImage(img.url)
                        ]
                    }).catch(() => {});

                });

            });
        };
    }

};