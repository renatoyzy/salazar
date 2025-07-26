import { 
    SnowflakeUtil,
    Routes 
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import botConfig from "../config.json" with { type: "json" };
import client from "./Client.js";
import "dotenv/config";

/**
 * Retorna as configurações do servidor no banco de dados (ou undefined)
 * @param {SnowflakeUtil} serverId 
 */
export async function config(serverId) {
    const client = new MongoClient(process.env.DB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    try {
        await client.connect();

        const serverConfig = await client.db('Salazar').collection('configuration').findOne({ server_id: serverId });
        const plainObject = serverConfig ? JSON.parse(JSON.stringify(serverConfig)) : undefined;

        return plainObject || undefined;

    } catch(err) {
        return undefined;
    } finally {
        await client.close();
    }
}

/**
 * Retorna o setup do servidor no banco de dados (ou undefined)
 * @param {SnowflakeUtil} serverId 
 */
export async function setup(serverId) {
    const client = new MongoClient(process.env.DB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    try {
        await client.connect();

        const serverConfig = await client.db('Salazar').collection('setup').findOne({ server_id: serverId });
        const plainObject = serverConfig ? JSON.parse(JSON.stringify(serverConfig)) : undefined;

        return plainObject || undefined;

    } catch(err) {
        return undefined;
    } finally {
        await client.close();
    }
}

/**
 * Informa pagamento de um servidor
 * @param {SnowflakeUtil} serverId 
 * @param {number} tier
 * @returns {{} | undefined} Objeto das configurações do servidor (ou undefined se não existirem)
 */
export async function paid(serverId, tier) {
    const serverConfig = await config(serverId);
    const server_setup = !serverConfig && await setup(serverId);

    const client = new MongoClient(process.env.DB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    try {
        await client.connect();

        return serverConfig ?
            await client.db('Salazar').collection('configuration')
            .findOneAndUpdate(
                { server_id: serverId }, 
                { $set: { server_tier: tier } },
                { upsert: false, returnDocument: "after" }
            )
        :
            await client.db('Salazar').collection('setup')
            .findOneAndUpdate(
                { server_id: serverId }, 
                { $set: { server_tier: tier } },
                { upsert: true, returnDocument: "after" }
            );

    } catch(err) {
        return undefined;
    } finally {
        await client.close();
    }
}

/**
 * Configuração padrão e labels
 */
export const defaultConfiguration = {
    name: {
        label: "Nome do servidor",
        input: "texto",
    },
    extra_prompt: {
        label: "Prompt adicional",
        input: "texto",
    },
    action_timing: {
        label: "Segundos para enviar partes da ação",
        input: "tempo",
    },
    roles: {
        player: {
            label: "Cargo de jogador",
            input: "cargo"
        },
        non_player: {
            label: "Cargo de não jogador",
            input: "cargo"
        },
    },
    channels: {
        staff: {
            label: "Canal da administração",
            input: "canal",
        },
        logs: {
            label: "Canal de registros",
            input: "canal",
        },
        context: {
            label: "Canal da memória do bot",
            input: "canal",
        },
        actions: {
            label: "Canais de ações",
            input: "canal",
        },
        events: {
            label: "Canais de eventos",
            input: "canal",
        },
        narrations: {
            label: "Canal de narrações",
            input: "canal",
        },
        time: {
            label: "Canal de passagem do tempo",
            input: "canal",
        },
        secret_actions: {
            label: "Canal de ações secretas",
            input: "canal",
        },
        secret_actions_log: {
            label: "Canal administrativo de ações secretas",
            input: "canal",
        },
        country_category: {
            label: "Categoria de chat dos países",
            input: "canal",
        },
        country_picking: {
            label: "Canal de escolha de país",
            input: "canal",
        },
        picked_countries: {
            label: "Canal de países escolhidos",
            input: "canal",
        },
    },
};

/**
 * Gera os mapeamentos de argumentos e labels a partir do defaultConfiguration
 */
function getOptionsAlikeAndLabels(config = defaultConfiguration) {
    const optionsAlike = {};
    const optionLabels = {};

    function traverse(obj, prefix = "") {
        for (const key in obj) {
            const value = obj[key];
            const path = prefix ? `${prefix}.${key}` : key;

            if (typeof value === "object" && value.input) {
                // Mapeia tipo de input para argumento
                optionsAlike[path] = value.input;
                optionLabels[path] = value.label || key;
            } else if (typeof value === "object") {
                traverse(value, path);
            }
        }
    }

    traverse(config);
    return { optionsAlike, optionLabels };
}

// Exporte também os objetos prontos para uso
export const { optionsAlike, optionLabels } = getOptionsAlikeAndLabels(defaultConfiguration);

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
 * Normaliza uma opção de comando recursivamente
 * @param {Object} option - Opção a ser normalizada
 * @returns {Object} - Opção normalizada
 */
function normalizeOption(option) {
    const normalized = {
        type: option.type,
        name: option.name,
        description: option.description,
        required: option.required || false,
        choices: option.choices || undefined,
        options: option.options ? option.options.map(normalizeOption) : undefined
    };

    // Remove propriedades undefined para evitar diferenças
    Object.keys(normalized).forEach(key => {
        if (normalized[key] === undefined) {
            delete normalized[key];
        }
    });

    return normalized;
}

/**
 * Normaliza um comando para comparação, removendo propriedades específicas da API
 * @param {Object} command - Comando a ser normalizado
 * @returns {Object} - Comando normalizado
 */
function normalizeCommand(command) {
    const normalized = {
        name: command.name,
        description: command.description,
        type: command.type || 1, // Default para CHAT_INPUT
        options: command.options ? command.options.map(normalizeOption) : [],
        default_member_permissions: command.default_member_permissions || null,
        dm_permission: command.dm_permission !== undefined ? command.dm_permission : true
    };

    // Remove propriedades undefined para evitar diferenças
    Object.keys(normalized).forEach(key => {
        if (normalized[key] === undefined) {
            delete normalized[key];
        }
    });

    return normalized;
}

/**
 * Compara dois arrays de comandos para ver se são iguais
 * @param {Array} currentCommands - Comandos atuais do servidor
 * @param {Array} newCommands - Novos comandos a serem registrados
 * @returns {boolean} - true se os comandos são iguais
 */
function compareCommands(currentCommands, newCommands) {
    if (currentCommands.length !== newCommands.length) {
        return false;
    }

    // Normaliza e ordena os comandos para comparação consistente
    const normalizedCurrent = currentCommands.map(normalizeCommand).sort((a, b) => a.name.localeCompare(b.name));
    const normalizedNew = newCommands.map(normalizeCommand).sort((a, b) => a.name.localeCompare(b.name));

    // Compara cada comando
    for (let i = 0; i < normalizedCurrent.length; i++) {
        const current = normalizedCurrent[i];
        const newCmd = normalizedNew[i];

        // Compara usando JSON.stringify após normalização
        if (JSON.stringify(current) !== JSON.stringify(newCmd)) {
            console.log(`- Comando ${current.name} é diferente:`);
            console.log('  Atual:', JSON.stringify(current, null, 2));
            console.log('  Novo:', JSON.stringify(newCmd, null, 2));
            return false;
        }
    }

    return true;
}

/**
 * Adiciona os comandos do bot em um servidor
 * @param {SnowflakeUtil} serverId - Id do servidor que receberá os comandos
 */
export default async function deployCommands(serverId) {

    const serverConfig = await config(serverId);
    const server_setup = !serverConfig && await setup(serverId);

    let commands = [];
    const commandFiles = getFiles("./commands");

    for (const file of commandFiles) {
        // Use import dinâmico em ES module
        const command = (await import(path.resolve(file))).default;
        if((
            command.min_tier<=serverConfig?.server_tier || 
            !command.min_tier
        ) && (
            command.setup_step<=server_setup?.server_setup_step || 
            !command.setup_step && command.setup_step!==0 && !server_setup && serverConfig || 
            command.setup_step<0 || 
            command.setup_step===0 && !server_setup && !serverConfig
        )) {
            commands.push(command.data.toJSON());
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    // Busca os comandos atuais do servidor
    const guild = await client.guilds.fetch(serverId);
    const currentCommandsCollection = await guild.commands.fetch();
    const currentCommands = Array.from(currentCommandsCollection.values());

    // Compara os comandos atuais com os novos
    if (compareCommands(currentCommands, commands)) {
        return;
    }

    // Registra os comandos apenas se forem diferentes
    try {
        await rest.put(
            Routes.applicationGuildCommands(botConfig.id, serverId),
            { body: commands }
        );
        console.log(`- Comandos registrados em ${guild.name} (${serverId})`);
    } catch (error) {
        console.error(`- Erro ao registrar comandos em ${guild.name} (${serverId}):`, error);
    }
}