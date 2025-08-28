import { Client } from "discord.js";
import projectPackage from "../package.json" with { type: "json" };
import botConfig from "../config.json" with { type: "json" };
import { deployCommands } from "../src/Client.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import * as Server from "../src/Server.js";

// Função para limpar configurações inválidas de todos os servidores
async function cleanAllConfigs() {
    const mongoClient = new MongoClient(process.env.DB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });
    try {
        await mongoClient.connect();
        const collection = mongoClient.db('Salazar').collection('configuration');
        const allConfigs = await collection.find({}).toArray();

        for (const configDoc of allConfigs) {
            if (!configDoc.server_id || !configDoc.server) continue;
            const cleaned = Server.cleanConfig(configDoc.server, Server.defaultConfiguration);

            // Só atualiza se havia campos extras e realmente mudou
            if (JSON.stringify(configDoc.server) !== JSON.stringify(cleaned)) {
                await collection.updateOne(
                    { server_id: configDoc.server_id },
                    { $set: { server: cleaned } }
                );
                console.log(`- Configuração inválida removida do servidor ${configDoc.server?.name || configDoc.server_id}.`);
            }
        }
    } catch (err) {
        console.error("- Erro ao limpar configurações:", err);
    } finally {
        await mongoClient.close();
    }
};

export default {
    name: 'clientReady',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O ${botConfig.name} ${projectPackage.version} está ligado e operando em ${(await client.guilds.fetch()).size} servidores.`);

        await cleanAllConfigs();

        (await client.guilds.fetch()).forEach(guild => {
            deployCommands(guild.id);
        });
    }
};