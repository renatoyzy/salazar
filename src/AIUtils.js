import { GenerateContentResponse, GoogleGenAI, createUserContent } from "@google/genai";
import botConfig from "../config.json" with { type: "json" };
import { createHash } from "crypto";
import 'dotenv/config';

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/**
 * Envia uma requisição para a IA.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @param {string} model - O modelo de IA a ser utilizado
 * @param {string[]} imageUrl - Incluir uma imagem pra analisar caso suportado
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se ocorrer um erro ao enviar a requisição
 */
export async function sendRequisition(prompt, model, imageUrl=undefined) {
  try {
    if(imageUrl && imageUrl.length>0) {
      let userContent = [prompt];
      try {
        for (const image in imageUrl) {
          const imageResponse = await fetch(image);
          const imageArrayBuffer = await imageResponse.arrayBuffer();
          const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');
          userContent.push({
            inlineData: {
              mimeType: "image/png",
              data: base64ImageData,
            },
          })
        }
      } finally {
        const response = await ai.models.generateContent({
          model: model,
          contents: createUserContent(userContent),
        });
        return response;
      }
    } else {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt
      });
      return response;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Gera uma resposta da IA com base no prompt fornecido, tentando todos os modelos em ordem.
 * @param {string} prompt - O prompt a ser enviado para a IA
 * @param {string | string[]} imageUrl - Incluir uma imagem pra analisar caso suportado
 * @returns {Promise<GenerateContentResponse>} - A resposta da IA
 * @throws {Error} - Se o prompt for inválido ou se ocorrer um erro na geração
 */
export async function aiGenerate(prompt, imageUrl=undefined) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error("O prompt deve ser uma string não vazia.");
  }

  const models = Array.isArray(botConfig.model) ? botConfig.model : [botConfig.model];

  let lastError;
  for (const model of models) {
    try {
      const response = await sendRequisition(prompt, model, typeof imageUrl == "string" ? [imageUrl] : imageUrl);
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