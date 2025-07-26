import { Client } from "discord.js";
import projectPackage from "../package.json" with { type: "json" };
import botConfig from "../config.json" with { type: "json" };
import { deployCommands } from "../src/Client.js";

export default {
    name: 'ready',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O ${botConfig.name} ${projectPackage.version} está ligado e operando em ${(await client.guilds.fetch()).size} servidores.`);

        (await client.guilds.fetch()).forEach(guild => {
            deployCommands(guild.id);
        });
    }
};
