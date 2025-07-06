import deploy_commands from "../src/deploy_commands.js";
import client from "../src/client.js";
import { Guild } from "discord.js";

export default {
    name: 'guildCreate',

    /**
     * @param {Guild} guild 
     */
    async execute(guild) {
        const fetchedGuild = await client.guilds.fetch(guild.id);
        fetchedGuild.systemChannel?.send('Oi!!!');
        deploy_commands();
    }
};
