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
 * Separa um texto em chunks, priorizando quebras de linha para preservar markdown.
 * @param {string} texto - Texto completo a ser separado.
 * @param {number} maxLength - Tamanho máximo de cada chunk.
 * @returns {string[]} Array de chunks.
 */
export function chunkifyText(texto, maxLength = 2000) {
    const lines = texto.split('\n');
    const chunks = [];
    let currentChunk = '';

    for (const line of lines) {
        // Se adicionar a linha excede o limite, salva o chunk atual e começa outro
        if ((currentChunk.length + line.length + 1) > maxLength) {
            if (currentChunk) chunks.push(currentChunk);
            currentChunk = line;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
        }
    }
    if (currentChunk) chunks.push(currentChunk);

    return chunks;
}