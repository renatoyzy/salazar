import Discord, { 
    CommandInteraction, 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    EmbedBuilder, 
    MessageFlags, 
    Colors
} from "discord.js";
import Canvas from "canvas";
import fs from "fs";
import path from "path";
import { inspect } from "node:util";
import bot_config from "../../config.json" with { type: "json" };
import config from "../../src/config.js";
import project_package from "../../package.json" with { type: "json" };
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export default {
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("[Desenvolvedor] Executa um código JavaScript diretamente do discord")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("código")
            .setDescription("Código a ser executado")
            .setRequired(true)
        ),

    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        if (!bot_config.owners.includes(interaction.user.id)) {
            return interaction.reply({
                content: "Este comando não foi feito para que __você__ o use.",
                flags: [MessageFlags.Ephemeral]
            });
        }

        async function _evalCode(code, interaction) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.DarkGrey)
                    .setDescription("Carregando.")
                ],
                flags: [MessageFlags.Ephemeral]
            }).catch(() => {});

            let replyColor;
            let replyTitle;
            let output;

            try {
                output = await eval(code);
                replyColor = Colors.Blurple;
                replyTitle = "Código executado!";
            } catch (error) {
                output = error.toString();
                replyColor = Colors.Red;
                replyTitle = "Código não executado";
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(replyTitle)
                        .addFields([
                            {
                                name: "Entrada",
                                value: `\`\`\`js\n${code}\n\`\`\``
                            },
                            {
                                name: "Saída",
                                value: `\`\`\`js\n${inspect(output, { depth: 0 }).slice(0, 990)}\n\`\`\``
                            }
                        ])
                        .setColor(replyColor)
                ]
            }).catch(() => {});
        }

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(Colors.DarkGrey)
                    .setDescription("Carregando...")
            ],
            flags: [MessageFlags.Ephemeral]
        }).then(async () => {
            _evalCode(interaction.options.get("código").value, interaction).catch(err => {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(Colors.Red)
                            .setDescription(`${err}`)
                    ],
                    flags: [MessageFlags.Ephemeral]
                }).catch(() => {});
            });
        }).catch(() => {});
    }
};

// Funções auxiliares
function roundTwo(n) {
    return `${(+(Math.round(n + "e+2") + "e-2")).toLocaleString()}`;
}

function roundTwoOg(n) {
    return +(Math.round(n + "e+2") + "e-2");
}
