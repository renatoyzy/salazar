import Discord from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.json" with { type: "json" };
import client from "./src/client.js";
import "dotenv/config";
import deploy_commands from "./deploy_commands.js";

// Simular __dirname em ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = await import(`file://${filePath}`);
    const event = eventModule.default || eventModule; // Suporte para export default

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Crash handle
process.on('uncaughtException', async (erro, origem) => {
    console.error(`Exceção não capturada.\n\nErro: ${erro}\n\nOrigem: ${origem}`);
    try {
        await client.guilds.cache.get(config.server.id)?.channels.cache.get(config.server.channels.logs)?.send({
            content: `<@${config.bot.owners.join('> <@')}>`,
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(Discord.Colors.Red)
                    .setTitle(`Exceção não capturada`)
                    .setDescription(`${erro}`)
                    .addFields([{
                        name: `Origem`,
                        value: `${origem}`
                    }])
                    .setFooter({ text: generateTimestamp() })
            ]
        });
    } catch (e) {
        console.error("Erro ao enviar log da exceção:", e);
    }
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error(`Rejeição não manuseada: ${reason} ${promise}`);
    try {
        await client.guilds.cache.get(config.server.id)?.channels.cache.get(config.server.channels.logs)?.send({
            content: `<@${config.bot.owners.join('> <@')}>`,
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(Discord.Colors.Red)
                    .setTitle(`Rejeição não manuseada`)
                    .setDescription(`${reason}`)
                    .setFooter({ text: generateTimestamp() })
            ]
        });
    } catch (e) {
        console.error("Erro ao enviar log da rejeição:", e);
    }
});

deploy_commands();

// Logar o cliente
client.login(process.env.DISCORD_TOKEN);

// Função auxiliar para gerar timestamp
function generateTimestamp() {
    const date = new Date();
    return `${date.getHours().toString().padStart(2, '0')}:` +
           `${date.getMinutes().toString().padStart(2, '0')}:` +
           `${date.getSeconds().toString().padStart(2, '0')}.` +
           `${date.getMilliseconds().toString()} ` +
           `${date.getDate().toString().padStart(2, '0')}/` +
           `${(date.getMonth() + 1).toString().padStart(2, '0')}/` +
           `${date.getFullYear()}`;
}
