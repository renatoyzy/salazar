/**
 * Simplifica ao máximo uma string
 * @param {string} string - Texto a ser simplificado
 * @param {boolean} keepNumbers - Se os números devem ser mantidos
 */
export function simplifyString(string, keepNumbers=false) {
    let regex = /[^a-zA-Z ]/g;

    if(keepNumbers) regex = /[^a-zA-Z0-9 ]/g;

    else return string.trim().toLowerCase().replaceAll('-', ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(regex, '');
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