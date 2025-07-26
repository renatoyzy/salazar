import client from "../src/Client.js"
import { config } from "../src/Server.js";

export default {
    name: 'hourly',
    cron: '* * * * * *',

    async execute() {

        // Ações aleatórias NPC
        client.guilds.cache.forEach(async guild => {

            const serverConfig = await config(guild.id);

            serverConfig?.server?.channels?.npc_random_actions &&
            guild.channels.cache.get(serverConfig?.server?.channels?.npc_random_actions).send('teste ação npc aleatória horária')

        });

    }
}