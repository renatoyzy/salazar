import * as Discord from "discord.js"
import { 
    SlashCommandBuilder, 
    SlashCommandStringOption, 
    EmbedBuilder, 
    Colors,
    ChatInputCommandInteraction
} from "discord.js";
import { inspect } from "util";
import botConfig from "../../config.json" with { type: "json" };
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import Canvas from "canvas";
import fs from "fs";
import path from "path";
import * as Server from "../../src/Server.js";
import projectPackage from "../../package.json" with { type: "json" };
import client, { announce } from "../../src/Client.js";
import * as Roleplay from "../../src/Roleplay.js";
import { aiGenerate, sendRequisition } from "../../src/AIUtils.js";
import {
    chunkifyText,
    simplifyString
} from "../../src/StringUtils.js";
import {
    getAverageColor,
    fetchImageAsPngBuffer,
    isImageSafe,
    makeRoundFlag
} from "../../src/VisualUtils.js";
import gis from "g-i-s";

/**
 * Formata a saída para exibição melhorada
 * @param {any} output - Saída a ser formatada
 * @param {number} maxLength - Tamanho máximo da string
 * @returns {string} - Saída formatada
 */
function formatOutput(output, maxLength = 1800) {
    try {
        let formatted;
        
        if (output === undefined) {
            formatted = "undefined";
        } else if (output === null) {
            formatted = "null";
        } else if (typeof output === 'string') {
            formatted = output;
        } else if (typeof output === 'function') {
            formatted = `[Function: ${output.name || 'anonymous'}]`;
        } else if (output instanceof Promise) {
            formatted = "[Promise] (use await para resolver)";
        } else if (output instanceof Error) {
            formatted = `${output.name}: ${output.message}\n${output.stack?.split('\n').slice(0, 3).join('\n') || ''}`;
        } else if (typeof output === 'object') {
            try {
                // Tenta JSON.stringify primeiro para objetos simples
                formatted = JSON.stringify(output, null, 2);
            } catch {
                // Fallback para inspect se JSON.stringify falhar
                formatted = inspect(output, { 
                    depth: 2, 
                    colors: false, 
                    maxArrayLength: 10,
                    maxStringLength: 200,
                    breakLength: 80,
                    compact: false,
                    showHidden: false
                });
            }
        } else {
            formatted = String(output);
        }

        // Limita o tamanho da saída
        if (formatted.length > maxLength) {
            const truncatePoint = maxLength - 50;
            formatted = formatted.slice(0, truncatePoint) + "\n\n... (truncado - resultado muito longo)";
        }

        return formatted;
    } catch (error) {
        return `[Erro ao formatar saída]: ${error.message}`;
    }
}

/**
 * Executa código JavaScript com contexto completo
 * @param {string} code - Código a ser executado
 * @param {ChatInputCommandInteraction} interaction - Interação do Discord
 */
async function executeCode(code, interaction) {
    await interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle("⚡ Executando código...")
            .setDescription(`\`\`\`js\n${code.slice(0, 200)}${code.length > 200 ? '\n...' : ''}\n\`\`\``)
        ]
    }).catch(() => {});

    const startTime = process.hrtime.bigint();
    let output;
    let success = true;
    let isAsync = false;

    try {
        // Detecta se o código é assíncrono
        const asyncPattern = /\b(await|async)\b/;
        isAsync = asyncPattern.test(code);

        // Cria contexto de execução com todas as variáveis disponíveis
        const context = {
            // Discord imports
            Discord, SlashCommandBuilder, SlashCommandStringOption, 
            EmbedBuilder, Colors, ChatInputCommandInteraction,
            // Utilities
            inspect, botConfig, GoogleGenAI, Canvas, fs, path,
            // Project modules
            Server, projectPackage, client, announce, Roleplay,
            aiGenerate, sendRequisition, chunkifyText, simplifyString,
            getAverageColor, fetchImageAsPngBuffer, isImageSafe, makeRoundFlag,
            gis,
            // Discord context
            interaction, guild: interaction.guild, channel: interaction.channel,
            user: interaction.user, member: interaction.member,
            // Utilities
            console, process, setTimeout, clearTimeout,
            setInterval, clearInterval, Promise, Buffer
        };

        // Injeta o contexto no código
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        let result;
        
        if (isAsync) {
            // Para código assíncrono
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(...contextKeys, `
                try {
                    return await (async () => {
                        ${code}
                    })();
                } catch (error) {
                    throw error;
                }
            `);
            
            result = await Promise.race([
                fn(...contextValues),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("⏰ Timeout: Execução cancelada após 30 segundos")), 30000)
                )
            ]);
        } else {
            // Para código síncrono
            const fn = new Function(...contextKeys, `
                try {
                    return (function() {
                        ${code}
                    })();
                } catch (error) {
                    throw error;
                }
            `);
            
            result = fn(...contextValues);
            
            // Se retornou uma Promise, resolve ela
            if (result instanceof Promise) {
                result = await Promise.race([
                    result,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("⏰ Timeout: Promise não resolvida em 30 segundos")), 30000)
                    )
                ]);
            }
        }
        
        output = result;
        
    } catch (error) {
        output = error;
        success = false;
    }

    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

    // Formata saída
    const formattedOutput = formatOutput(output);
    const outputType = output === null ? 'null' : 
                      output === undefined ? 'undefined' : 
                      output?.constructor?.name || typeof output;

    // Determina cor e ícone baseado no resultado
    const embedColor = success ? 
        (output === undefined ? Colors.Grey : Colors.Green) : Colors.Red;
    
    const statusIcon = success ? 
        (output === undefined ? "📝" : "✅") : "❌";

    // Constrói embed de resposta
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`${statusIcon} ${success ? 'Executado' : 'Erro'}`)
        .addFields([
            {
                name: "📥 Entrada",
                value: `\`\`\`js\n${code.length > 500 ? code.slice(0, 500) + '\n...' : code}\n\`\`\``,
                inline: false
            },
            {
                name: "📤 Saída",
                value: formattedOutput.length > 0 ? 
                    `\`\`\`js\n${formattedOutput}\n\`\`\`` : 
                    `\`\`\`\n(sem saída)\n\`\`\``,
                inline: false
            }
        ])
        .setFooter({
            text: `${executionTime.toFixed(2)}ms • ${outputType} • ${isAsync ? 'async' : 'sync'}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

    // Adiciona stack trace para erros
    if (!success && output.stack) {
        const stackLines = output.stack.split('\n').slice(1, 4);
        if (stackLines.length > 0) {
            embed.addFields([{
                name: "📍 Stack Trace",
                value: `\`\`\`\n${stackLines.join('\n')}\n\`\`\``,
                inline: false
            }]);
        }
    }

    await interaction.editReply({
        embeds: [embed]
    }).catch(console.error);
}

export default {
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("[Desenvolvedor] Executa código JavaScript diretamente pelo Discord")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("código")
            .setDescription("Código JavaScript para executar")
            .setRequired(true)
        ),
    
    setup_step: -1,
    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        // Verifica permissão
        if (!botConfig.owners?.includes(interaction.user.id)) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("🚫 Acesso Negado")
                    .setDescription("Este comando é restrito aos desenvolvedores do bot.")
                ]
            });
        }

        const code = interaction.options.getString("código");

        try {
            await executeCode(code, interaction);
        } catch (error) {
            console.error("Erro crítico no eval:", error);
            
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle("💥 Erro crítico")
                    .setDescription("Falha interna no sistema de execução")
                    .addFields([{
                        name: "Detalhes",
                        value: `\`\`\`js\n${error.message || 'Erro desconhecido'}\n\`\`\``
                    }])
                    .setTimestamp()
                ]
            }).catch(() => {});
        }
    }
};