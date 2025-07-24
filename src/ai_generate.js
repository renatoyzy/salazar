import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import bot_config from "../config.json" with { type: "json" };
import 'dotenv/config';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/**
 * Envia uma requisição para a IA.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @param {string} model - O modelo de IA a ser utilizado
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se ocorrer um erro ao enviar a requisição
 */
async function sendRequisition(prompt, model) {
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Gera uma resposta da IA com base no prompt fornecido, tentando todos os modelos em ordem.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se o prompt for inválido ou se ocorrer um erro na geração
 */
export default async function ai_generate(prompt) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error("O prompt deve ser uma string não vazia.");
    }

    const models = Array.isArray(bot_config.model) ? bot_config.model : [bot_config.model];

    let lastError;
    for (const model of models) {
        try {
            const response = await sendRequisition(prompt, model);
            console.log(`-- O Salazar está usando o modelo ${model}`);
            return response;
        } catch (error) {
            lastError = error;
            // Tenta o próximo modelo
        }
    }
    // Se chegou aqui, todos falharam
    console.error("Erro ao gerar resposta da IA:", lastError);
    throw new Error("Não foi possível obter uma resposta da IA em nenhum modelo.");
}