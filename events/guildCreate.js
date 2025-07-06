import deploy_commands from "../src/deploy_commands.js";
import client from "../src/client.js";

export default {
    name: 'guildCreate',

    async execute(guild) {
        const fetchedGuild = await client.guilds.fetch(guild.id);
        fetchedGuild.systemChannel?.send('Oi!!!');
        deploy_commands();
    }
};
