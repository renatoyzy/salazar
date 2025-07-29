import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import botConfig from "./config.json" with { type: "json" };
import client from "./src/Client.js";
import cron from "node-cron";
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

// Handler para eventos periódicos (timed)
const timedPath = path.join(__dirname, 'timed');
const timedFiles = fs.existsSync(timedPath) ? fs.readdirSync(timedPath).filter(file => file.endsWith(".js")) : [];
for (const file of timedFiles) {
    const filePath = path.join(timedPath, file);
    const timedModule = await import(`file://${filePath}`);
    const timed = timedModule.default || timedModule;

    if (timed.cron && typeof timed.execute === "function") {
        cron.schedule(timed.cron, async () => {
            try {
                await timed.execute();
                //console.log(`[Timed] Executado: ${timed.name}`);
            } catch (err) {
                console.error(`[Timed] Erro ao executar ${timed.name}:`, err);
            }
        });
        //console.log(`[Timed] Registrado: ${timed.name} (${timed.cron})`);
    }
}

// Crash handle
process.on('uncaughtException', async (err, origin) => {
    console.error(`Exceção não capturada.`, err, origin);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error(`Rejeição não manuseada.`, reason, promise);
});

// Logar o cliente
client.login(process.env.DISCORD_TOKEN);
