import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import config from "../config.json" with { type: "json" };
import "dotenv/config";

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

export default async function deploy_commands() {
    let commands = [];
    const commandFiles = getFiles("./commands");

    for (const file of commandFiles) {
        // Use import dinâmico em ES module
        const command = (await import(path.resolve(file))).default;
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    rest.put(
        Routes.applicationGuildCommands(config.bot.id, config.server.id),
        { body: commands }
    )
    .then(() => console.log(`Comandos de aplicação registrados com sucesso.`))
    .catch(console.error);
}
