import Canvas from "canvas";
import fetch from "node-fetch";

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