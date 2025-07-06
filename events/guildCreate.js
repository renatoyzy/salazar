import deploy_commands from "../src/deploy_commands.js";
import client from "../src/client.js";
import { Guild } from "discord.js";

export default {
    name: 'guildCreate',

    /**
     * @param {Guild} guild 
     */
    async execute(guild) {
        (await guild.channels.fetch()).sorted().first().send(`Oiii`)
        deploy_commands(guild.id);
    }
};
