import Discord from "discord.js";
import config from "../../config.json" with { type: "json" };
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export default {
    data: new Discord.SlashCommandBuilder()
        .setName("palpite")
        .setDescription("[Administrativo] Peça palpites do roleplay ao Salazar.")
        .addStringOption(
            new Discord.SlashCommandStringOption()
                .setName("prompt")
                .setDescription("O que será perguntado")
                .setRequired(true)
        ),

    async execute(interaction) {
        if (!config.server.roles.adm.some(roleId => interaction.member.roles.cache.has(roleId))) {
            return interaction.reply({
                content: "Este comando não foi feito para que __você__ o use. Apenas administradores.",
                flags: [Discord.MessageFlags.Ephemeral]
            });
        }

        interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor("DarkGrey")
                    .setDescription("Gerando seu palpite...")
            ],
            //flags: [Discord.MessageFlags.Ephemeral]
        }).then(async (msg) => {
            let acao_contexto = (await interaction.guild.channels.cache.get(config.server.channels.context).messages.fetch())
                .sort()
                .map(msg => msg.content)
                .join('\n\n');

            const prompt = `Você é o Salazar, um bot narrador imparcial de um roleplay geopolítico ambientado no século XIX chamado ${interaction.guild.name}, que está dialogando com um jogador sobre o roleplay.
            - REGRAS:
            1. Use fatos históricos relevantes, fatos do contexto do roleplay para gerar uma narração de peso e relevante.
            2. Não considere fatos citados pelo jogador se você não tiver como conferir eles no contexto histórico e eles não forem verdade.
            3. Nunca escreva mais de 2000 caracteres

            - HISTÓRICO DO ROLEPLAY: ${acao_contexto}
            
            - Agora, o ${interaction.member.user.username} te mencionou dizendo '${interaction.options.get("prompt").value}'. Responda exatamente a melhor resposta possível para isso.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt
            });

            msg.edit({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(Discord.Colors.Blurple)
                        .setTitle('Palpites do Salazar')
                        .setDescription(response.text)
                ]
            }).catch(() => {});
        }).catch(() => {});
    }
};
