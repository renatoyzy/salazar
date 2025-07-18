import { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    Colors, MessageFlags, 
    EmbedBuilder, 
    PermissionsBitField,
    ChatInputCommandInteraction
} from "discord.js";
import bot_config from "../../config.json" with { type: "json" };
import { config } from "../../src/server_info.js";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export default {
    data: new SlashCommandBuilder()
        .setName("palpite")
        .setDescription(`[Administrativo] Peça palpites do roleplay ao ${bot_config.name}.`)
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

        const server_config = await config(interaction.guildId);

        if(!server_config) return interaction.editReply({
            content: `Esse servidor não está configurado corretamente. Contate um administrador.`
        });
        
        if(!server_config?.server_tier >= 2) return interaction.editReply({
            content: `Este servidor não possui o tier necessário para usar esse comando.`
        });

        if (server_config.server_tier<4 && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.editReply({
            content: "No plano atual deste servidor, este comando é apenas para administradores."
        });

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.DarkGrey)
                .setDescription("Gerando seu palpite...")
            ],
        }).then(async () => {
            let acao_contexto = (await interaction.guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
                ?.sort()
                ?.map(msg => msg.content)
                ?.join('\n\n');

            if(!acao_contexto) return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Algo está errado com a configuração do servidor.`)]})

            const prompt = eval("`" + process.env.PROMPT_PALPITE + "`");

            const response = await ai.models.generateContent({
                model: bot_config.model,
                contents: prompt
            });

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Blurple)
                    .setTitle(`Palpites do ${bot_config.name}`)
                    .setDescription(response.text)
                ]
            }).catch(() => {});
        }).catch(() => {});
    }
};
