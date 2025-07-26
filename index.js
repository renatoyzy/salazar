import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import botConfig from "./config.json" with { type: "json" };
import client from "./src/Client.js";
import "dotenv/config";

// Simular __dirname e __filename no ES module
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
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error(`Rejeição não manuseada: ${reason} ${promise}`);
});

// Logar o cliente
client.login(process.env.DISCORD_TOKEN);
