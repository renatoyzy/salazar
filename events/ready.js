import { Client } from "discord.js";
import project_package from "../package.json" with { type: "json" };
import botConfig from "../config.json" with { type: "json" };
export default {
    name: 'ready',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O ${botConfig.name} ${project_package.version} está ligado e operando em ${(await client.guilds.fetch()).size} servidores.`);

        (await client.guilds.fetch()).forEach(guild => {
            Server.deployCommands(guild.id);
        });
    }
};
