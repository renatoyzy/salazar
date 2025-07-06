import { Client } from "discord.js";
import project_package from "../package.json" with { type: "json" };

export default {
    name: 'ready',
    once: true,

    /**
     * @param {Client} client 
     */
    async execute(client) {
        console.warn(`O Salazar ${project_package.version} está ligado e operando.`);
    }
};
