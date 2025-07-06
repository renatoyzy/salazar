import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { SnowflakeUtil, Routes } from "discord.js";
import bot_config from "../config.json" with { type: "json" };
import "dotenv/config";
import client from "./client.js";

/**
 * @param {string} dir 
 */
export function getFiles(dir) {
    const files = fs.readdirSync(dir, {
        withFileTypes: true,
    });

    let commandFiles = [];

    for (const file of files) {
        if (file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(`${dir}/${file.name}`),
            ];
        } else if (file.name.endsWith(".js")) {
            commandFiles.push(`${dir}/${file.name}`);
        }
    }

    return commandFiles;
}

/**
 * Adiciona os comandos do bot em um servidor
 * @param {SnowflakeUtil} serverId - Id do servidor que receberá os comandos
 */
export default async function deploy_commands(serverId) {
    let commands = [];
    const commandFiles = getFiles("./commands");

    for (const file of commandFiles) {
        // Use import dinâmico em ES module
        const command = (await import(path.resolve(file))).default;
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    rest.put(
        Routes.applicationGuildCommands(bot_config.id, serverId),
        { body: commands }
    )
    .then(async () => console.log(`- Comandos registrados em ${(await client.guilds.fetch(serverId)).name} (${serverId}) ${(await (await client.guilds.fetch(serverId)).invites.fetch()).first()}`))
    .catch(console.error);
}
