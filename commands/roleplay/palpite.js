import { 
    CommandInteraction, 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    Colors, MessageFlags, 
    EmbedBuilder, 
    PermissionsBitField
} from "discord.js";
import bot_config from "../../config.json" with { type: "json" };
import config from "../../src/config.js";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export default {
    data: new SlashCommandBuilder()
        .setName("palpite")
        .setDescription("[Administrativo] Peça palpites do roleplay ao Salazar.")
        .addStringOption(
            new SlashCommandStringOption()
                .setName("prompt")
                .setDescription("O que será perguntado")
                .setRequired(true)
        ),
    
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const server_config = await config(interaction.guildId);
        
        if(!server_config?.server_tier >= 2) return interaction.reply({
            content: `Este servidor não possui o tier necessário para usar esse comando.`,
            flags: [MessageFlags.Ephemeral]
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({
            content: "Este comando é apenas para administradores.",
            flags: [MessageFlags.Ephemeral]
        });

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.DarkGrey)
                .setDescription("Gerando seu palpite...")
            ],
        }).then(async (msg) => {
            let acao_contexto = (await interaction.guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
                ?.sort()
                ?.map(msg => msg.content)
                ?.join('\n\n');

            if(!acao_contexto) return msg.edit({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Algo está errado com a configuração do servidor.`)]})

            const prompt = `Você é o Salazar, um bot narrador imparcial de um roleplay geopolítico chamado ${interaction.guild.name}, que está dialogando com um jogador sobre o roleplay.
            - REGRAS:
            1. Use fatos históricos relevantes, fatos do contexto do roleplay para gerar uma narração de peso e relevante.
            2. Não considere fatos citados pelo jogador se você não tiver como conferir eles no contexto histórico e eles não forem verdade.
            3. Nunca escreva mais de 2000 caracteres

            - HISTÓRICO DO ROLEPLAY: ${acao_contexto}
            
            - Agora, o ${interaction.member.user.displayName} te mencionou dizendo '${interaction.options.get("prompt").value}'. Responda exatamente a melhor resposta possível para isso.`;

            const response = await ai.models.generateContent({
                model: bot_config.model,
                contents: prompt
            });

            msg.edit({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Blurple)
                    .setTitle('Palpites do Salazar')
                    .setDescription(response.text)
                ]
            }).catch(() => {});
        }).catch(() => {});
    }
};
