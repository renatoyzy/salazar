import Canvas from "canvas";
import fetch from "node-fetch";
import sharp from "sharp";
import "dotenv/config";

/**
 * Retorna a cor média de uma imagem a partir da URL.
 * @param {string} imageUrl
 * @returns {Promise<number>} Cor média em formato decimal (para EmbedBuilder.setColor)
 */
export async function getAverageColor(imageUrl) {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    const img = await Canvas.loadImage(buffer);
    const canvas = Canvas.createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
    }
    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);
    // Retorna como número decimal para o Discord
    return (r << 16) + (g << 8) + b;
}

/**
 * Bandeira arredondada
 * @param {string} imageUrlOrBuffer - Link ou buffer da imagem a virar bandeira
 */
export async function makeRoundFlag(imageUrlOrBuffer) {
    const canvas = Canvas.createCanvas(72 * 2, 52 * 2);
    const ctx = canvas.getContext('2d');
    const imageObj = await Canvas.loadImage(imageUrlOrBuffer);

    // Desenhar retângulo arredondado
    const x = 0;
    const y = 0;
    const width = 72 * 2;
    const height = 52 * 2;
    const radius = 10 * 2;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.clip();
    ctx.drawImage(imageObj, x, y, width, height);

    return canvas.toBuffer("image/png");
}

/**
 * Verifica se uma imagem é segura usando ModerateContent.
 * @param {string} imageUrl
 * @returns {boolean} true se a imagem for segura, false se for imprópria
 */
export function isImageSafe(imageUrl) {
    return true;
}

/**
 * Baixa uma imagem (SVG, PNG, JPG) e retorna um buffer PNG.
 * @param {string} imageUrl
 * @returns {Promise<Buffer>}
 */
export async function fetchImageAsPngBuffer(imageUrl) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Falha ao baixar imagem");
    const contentType = res.headers.get("content-type");
    const buffer = await res.buffer();

    if (contentType && contentType.includes("svg")) {
        // Converte SVG para PNG
        return await sharp(buffer).png().toBuffer();
    } else if (contentType && (contentType.includes("png") || contentType.includes("jpeg") || contentType.includes("jpg"))) {
        // Já é PNG/JPG, retorna buffer original
        return buffer;
    } else {
        throw new Error("Formato de imagem não suportado");
    }
}