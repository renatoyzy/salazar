import { createHash } from "crypto";

/**
 * Simplifica ao máximo uma string
 * @param {string} string - Texto a ser simplificado
 * @param {boolean} [keepNumbers=false] - Se os números devem ser mantidos
 * @param {boolean} [keepAccents=false] - Se os acentos devem ser mantidos
 * @param {boolean} [lowerCase=true] - Se o resultado deve ser em caixa baixa forçada
 * @returns {string}
 */
export function simplifyString(string, keepNumbers=false, keepAccents=false, lowerCase=true) {
    let regex = /[^a-zA-Z ]/g;

    if(keepNumbers) {
      if(keepAccents) regex = /[^A-zÀ-ú0-9 ]/g;
      else regex = /[^a-zA-Z0-9 ]/g;
    } else if(keepAccents) {
      regex = /[^A-zÀ-ú ]/g;
    }

    if(lowerCase) string = string.toLowerCase();

    if(keepAccents) return string.trim().replaceAll('-', ' ').replace(regex, '');
    else return string.trim().replaceAll('-', ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(regex, '');
}

/**
 * Separa um texto em chunks, priorizando quebras de linha para preservar markdown,
 * e adiciona um sufixo obrigatório em cada chunk sem ultrapassar o limite.
 * @param {string} originalText - Texto completo a ser separado.
 * @param {string} suffix - Sufixo obrigatório em cada chunk.
 * @param {number} maxLength - Tamanho máximo de cada chunk.
 * @returns {string[]} Array de chunks.
 */
export function chunkifyText(originalText, suffix = "", maxLength = 2000) {
    const lines = originalText.split('\n');
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
        // Se a linha sozinha + suffix já excede o limite, quebra ela
        if (line.length + suffix.length > maxLength) {
            // Salva o chunk atual se não estiver vazio
            if (currentChunk) {
                chunks.push(currentChunk + suffix);
                currentChunk = '';
            }
            
            // Quebra a linha longa priorizando pontos naturais
            const maxLineLength = maxLength - suffix.length;
            let remainingLine = line;
            
            while (remainingLine.length > maxLineLength) {
                let breakPoint = maxLineLength;
                
                // Procura pontos naturais de quebra (do mais preferível ao menos)
                const breakChars = ['\n', '. ', '! ', '? ', ', ', '; ', ': ', ' - ', ' ', '-'];
                
                for (const breakChar of breakChars) {
                    const lastIndex = remainingLine.lastIndexOf(breakChar, maxLineLength);
                    if (lastIndex > maxLineLength * 0.7) { // Pelo menos 70% do limite
                        breakPoint = lastIndex + breakChar.length;
                        break;
                    }
                }
                
                const part = remainingLine.slice(0, breakPoint);
                chunks.push(part + suffix);
                remainingLine = remainingLine.slice(breakPoint);
            }
            
            // Adiciona o resto se houver
            if (remainingLine) {
                chunks.push(remainingLine + suffix);
            }
            continue;
        }

        // Calcula tamanho considerando o suffix
        const totalLength = currentChunk.length + line.length + 1 + suffix.length;
        
        if (totalLength > maxLength) {
            // Salva o chunk atual e inicia um novo
            if (currentChunk) {
                chunks.push(currentChunk + suffix);
            }
            currentChunk = line;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    
    // Adiciona o último chunk se não estiver vazio
    if (currentChunk) {
        chunks.push(currentChunk + suffix);
    }

    return chunks;
}