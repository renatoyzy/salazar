import client from "../src/Client.js"
import { config } from "../src/Server.js";
import botConfig from "../config.json" with {type: "json"};
import { getAllPlayers, getContext, getCurrentDate } from "../src/Roleplay.js";

export default {
    name: 'hourly',
    cron: '* * * * * *', // 0 */1 * * *

    async execute() {

        // Ações aleatórias NPC
        client.guilds.cache.forEach(async guild => {

            const serverConfig = await config(guild.id);
            const actionContext = await getContext(guild);
            const serverRoleplayDate = await getCurrentDate(guild);
            const serverOwnedCountries = await getAllPlayers(guild);

            serverConfig?.server?.channels?.npc_random_actions &&
            guild.channels.cache.get(serverConfig?.server?.channels?.npc_random_actions).send('teste ação npc aleatória horária')

        });

    }
}