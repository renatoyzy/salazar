import { 
    BaseInteraction,
    EmbedBuilder,
    Colors,
    Collection,
    MessageFlags
} from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.json" with { type: "json" };
import client from "../src/client.js";

// Simular __dirname e __filename no ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

client.commands = await getCommands(path.join(__dirname, "../commands"));

export default {
    name: 'interactionCreate',
    
    /**
     * @param {BaseInteraction} interaction 
     */
    async execute(interaction) {

        if (interaction.isChatInputCommand()) {
            await handleChatInput(interaction);
        } 
        else if (interaction.isButton()) {
            await handleButton(interaction);
        }

    }
};

// Funções auxiliares

/**
 * @param {Interaction} interaction 
 */
async function handleChatInput(interaction) {
    const logChannel = interaction.guild.channels.cache.get(config.server.channels.logs);
    const interactionContent = interaction.options._hoistedOptions.length > 0
        ? interaction.options._hoistedOptions.map(x => `**${capitalize(x.name)}:** \`\`\`${x.value}\`\`\``)
        : "";

    const subcom = interaction.options.getSubcommand(false) ? ` ${interaction.options.getSubcommand()}` : "";

    if (logChannel) {
        const fields = [
            { name: `👤  Usuário`, value: `<@${interaction.user.id}> (${interaction.user.id})` },
            { name: `🤖  Comando`, value: `${interaction.commandName}${subcom}` }
        ];

        if (interactionContent) {
            fields.push({ name: `🔖  Conteúdo`, value: `${interactionContent.join("\n")}` });
        }

        fields.push({ name: `💬  Canal`, value: `<#${interaction.channelId}> (${interaction.channel.id})` });

        await logChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🤖  Registro de comando`)
                    .setFields(fields)
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(Colors.Blurple)
                    .setFooter({ text: formatDate(interaction.createdAt) })
            ]
        });
    }

    const command = client.commands.get(interaction.commandName);
    try {
        if (!interaction.replied) {
            await command.execute(interaction).catch(() => {});
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * @param {Interaction} interaction 
 */
async function handleButton(interaction) {
    const logChannel = interaction.guild.channels.cache.get(config.server.channels.logs);

    if (logChannel) {
        await logChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`🤖  Registro de uso de botão`)
                    .setFields([
                        { name: `👤  Usuário`, value: `<@${interaction.user.id}> (${interaction.user.id})` },
                        { name: `🤖  Informações`, value: `${interaction.customId}` },
                        { name: `💬  Canal`, value: `${interaction.message.url} (${interaction.channel.id})` }
                    ])
                    .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                    .setColor(Colors.Yellow)
                    .setFooter({ text: formatDate(interaction.createdAt) })
            ]
        });
    }

    client.buttons = new Collection();
    const buttonsPath = path.join(__dirname, "./buttons");
    const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith(".js"));

    for (const file of buttonFiles) {
        const { default: button } = await import(`file://${path.join(buttonsPath, file)}`);
        const buttonName = path.basename(file, ".js");
        client.buttons.set(buttonName, button);
    }

    const buttonHandler = client.buttons.get(interaction.customId);
    if (!buttonHandler) {
        return interaction.reply({ content: `Botão desconhecido.`, flags: [MessageFlags.Ephemeral] });
    }

    await buttonHandler.execute(interaction);
}

/**
 * @param {string} dir 
 */
async function getCommands(dir) {
    const commands = new Collection();
    const commandFiles = getFiles(dir);

    for (const commandFile of commandFiles) {
        const { default: command } = await import(`file://${commandFile}`);
        commands.set(command.data.toJSON().name, command);
    }

    return commands;
}

/**
 * @param {string} dir 
 */
function getFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let commandFiles = [];

    for (const file of files) {
        if (file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(path.join(dir, file.name))
            ];
        } else if (file.name.endsWith(".js")) {
            commandFiles.push(path.join(dir, file.name));
        }
    }

    return commandFiles;
}

/**
 * @param {string} str 
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @param {Date} date 
 */
function formatDate(date) {
    return `${date.getHours().toString().padStart(2, '0')}:` +
           `${date.getMinutes().toString().padStart(2, '0')}:` +
           `${date.getSeconds().toString().padStart(2, '0')}.` +
           `${date.getMilliseconds()} ` +
           `${date.getDate().toString().padStart(2, '0')}/` +
           `${(date.getMonth() + 1).toString().padStart(2, '0')}/` +
           `${date.getFullYear()}`;
}
