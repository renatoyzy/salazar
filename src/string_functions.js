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