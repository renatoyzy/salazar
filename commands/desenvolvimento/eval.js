import Discord, { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    EmbedBuilder, 
    Colors,
    ChatInputCommandInteraction
} from "discord.js";
import { inspect } from "util";
import bot_config from "../../config.json" with { type: "json" };
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import Canvas from "canvas";
import fs from "fs";
import path from "path";
import config from "../../src/config.js";
import project_package from "../../package.json" with { type: "json" };
import deploy_commands from "../../src/deploy_commands.js";

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
    
    setup_step: -1,
    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

        if (!bot_config.owners.includes(interaction.user.id)) {
            return interaction.editReply({
                content: "Esse é um comando de desenvolvimento que você não tem acesso."
            });
        }

        async function _evalCode(code, interaction) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.DarkGrey)
                    .setDescription("Carregando.")
                ]
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

        interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.DarkGrey)
                .setDescription("Carregando...")
            ]
        }).then(async () => {
            _evalCode(interaction.options.get("código").value, interaction).catch(err => {
                interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setDescription(`${err}`)
                    ]
                }).catch(() => {});
            });
        }).catch(() => {});
    }
};