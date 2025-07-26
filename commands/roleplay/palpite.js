import { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    Colors, 
    EmbedBuilder, 
    PermissionsBitField,
    ChatInputCommandInteraction
} from "discord.js";
import botConfig from "../../config.json" with { type: "json" };
import * as Server from "../../src/Server.js";
import 'dotenv/config';
import { getContext } from "../../src/Roleplay.js";
import { aiGenerate } from "../../src/AIUtils.js";

export default {
    data: new SlashCommandBuilder()
        .setName("palpite")
        .setDescription(`[Administrativo] Peça palpites do roleplay ao ${botConfig.name}.`)
        .addStringOption(
            new SlashCommandStringOption()
            .setName("prompt")
            .setDescription("O que será perguntado")
            .setRequired(true)
        ),

    min_tier: 2,
    
    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

        const serverConfig = await Server.config(interaction.guildId);

        if(!serverConfig) return interaction.editReply({
            content: `Esse servidor não está configurado corretamente. Contate um administrador.`
        });
        
        if(!serverConfig?.server_tier >= 2) return interaction.editReply({
            content: `Este servidor não possui o tier necessário para usar esse comando.`
        });

        if (serverConfig.server_tier<4 && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.editReply({
            content: "No plano atual deste servidor, este comando é apenas para administradores."
        });

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.DarkGrey)
                .setDescription("Gerando seu palpite...")
            ],
        }).then(async () => {
            let acao_contexto = await getContext(interaction.guild);

            if(!acao_contexto) return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Algo está errado com a configuração do servidor.`)]})

            const prompt = eval("`" + process.env.PROMPT_PALPITE + "`");

            const response = await aiGenerate(prompt).catch(error => {
                console.error("Erro ao gerar palpite:", error);
            });

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Blurple)
                    .setTitle(`Palpites do ${botConfig.name}`)
                    .setDescription(response.text)
                ]
            }).catch(() => {});
        }).catch(() => {});
    }
};
