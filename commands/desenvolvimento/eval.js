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
import { config, setup } from "../../src/server_info.js";
import project_package from "../../package.json" with { type: "json" };
import deploy_commands from "../../src/deploy_commands.js";
import client, { announce } from "../../src/client.js";
import server_paid from "../../src/server_paid.js";
import { GetContext } from "../../src/roleplay.js";
import ai_generate from "../../src/ai_generate.js";

/**
 * Formata a saída para exibição
 * @param {any} output - Saída a ser formatada
 * @returns {string} - Saída formatada
 */
function formatOutput(output) {
    try {
        let formatted;
        
        if (output === undefined) {
            formatted = "undefined";
        } else if (output === null) {
            formatted = "null";
        } else if (typeof output === 'string') {
            formatted = output;
        } else if (typeof output === 'function') {
            formatted = output.toString();
        } else {
            formatted = inspect(output, { 
                depth: 1, 
                colors: false, 
                maxArrayLength: 5,
                maxStringLength: 100,
                breakLength: 40,
                compact: true
            });
        }

        // Limita o tamanho da saída para Discord (máximo 900 caracteres para segurança)
        if (formatted.length > 900) {
            formatted = formatted.slice(0, 900) + "\n... (truncado)";
        }

        return formatted;
    } catch (error) {
        return `Erro ao formatar: ${error.message}`;
    }
}

/**
 * Executa o código com tratamento de erro melhorado
 * @param {string} code - Código a ser executado
 * @param {ChatInputCommandInteraction} interaction - Interação do Discord
 */
async function executeCode(code, interaction) {
    // Mostra status de carregamento
    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle("⏳ Executando...")
            .setDescription("Processando código...")
        ]
    }).catch(() => {});

    let replyColor;
    let replyTitle;
    let output;
    let executionTime;

    const startTime = Date.now();

    try {
        // Timeout para evitar códigos que travam
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout: Código levou mais de 10 segundos para executar")), 10000);
        });

        const evalPromise = Promise.resolve(eval(code));
        
        output = await Promise.race([evalPromise, timeoutPromise]);
        executionTime = Date.now() - startTime;
        
        replyColor = Colors.Green;
        replyTitle = "Código executado com sucesso!";
        
    } catch (error) {
        output = error.toString();
        executionTime = Date.now() - startTime; // Aproximação para timeout
        replyColor = Colors.Red;
        replyTitle = "Erro na execução";
    }

    // Formata a saída
    const formattedOutput = formatOutput(output);
    
    // Constrói embed de resposta
    const responseEmbed = new EmbedBuilder()
    .setTitle(replyTitle)
    .setColor(replyColor)
    .addFields([
        {
            name: "Entrada",
            value: `\`\`\`js\n${code.slice(0, 400)}${code.length > 400 ? '\n...' : ''}\n\`\`\``,
            inline: false
        },
        {
            name: "Saída",
            value: `\`\`\`js\n${formattedOutput}\n\`\`\``,
            inline: false
        }
    ])
    .setTimestamp()
    .setFooter({ 
        text: `⏱️ ${executionTime}ms | ${typeof output} | ${interaction.user.tag}`, 
        iconURL: interaction.user.displayAvatarURL() 
    });

    await interaction.editReply({
        embeds: [responseEmbed]
    }).catch(console.error);
};

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
        try {
            // Verifica se o usuário tem permissão
            if (!bot_config.owners.includes(interaction.user.id)) {
                return await interaction.editReply('Você não tem permissão para usar este comando de desenvolvimento.');
            }

            const code = interaction.options.getString("código");

            await executeCode(code, interaction);

        } catch (error) {
            console.error("Erro no comando eval:", error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("Erro interno")
                    .setDescription("Ocorreu um erro inesperado ao executar o comando.")
                    .addFields([
                        {
                            name: "Detalhes",
                            value: `\`\`\`js\n${error.message}\n\`\`\``
                        }
                    ])
                ]
            }).catch(() => {});
        }
    }
};