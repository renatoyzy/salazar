import { Client } from "discord.js";
import project_package from "../package.json" with { type: "json" };
import bot_config from "../config.json" with { type: "json" };
import deploy_commands from "../src/deploy_commands.js";

export default {
    name: 'ready',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O ${bot_config.name} ${project_package.version} está ligado e operando.`);

        (await client.guilds.fetch()).forEach(guild => {
            deploy_commands(guild.id);
        });
    }
};
