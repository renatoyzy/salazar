import { 
    ChannelType,
    Role,
    SnowflakeUtil,
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
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
 * Remove do objeto de configuração todos os campos que não existem mais no defaultConfiguration,
 * preservando apenas os válidos e mantendo a estrutura original.
 * @param {{}} config - Configuração atual do servidor (da DB)
 * @param {{}} defaultConfig - Estrutura padrão de configuração
 * @returns {{}} Configuração limpa
 */
export function cleanConfig(config, defaultConfig = defaultConfiguration) {
    if (!config || typeof config !== "object") return config;
    const cleaned = {};
    for (const key in defaultConfig) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            if (
                typeof config[key] === "object" &&
                typeof defaultConfig[key] === "object" &&
                !defaultConfig[key].input
            ) {
                // Recursivo para subcampos/categorias
                cleaned[key] = cleanConfig(config[key], defaultConfig[key]);
            } else {
                cleaned[key] = config[key];
            }
        }
    }
    return cleaned;
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
    const serverSetup = !serverConfig && await setup(serverId);

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
        onlyAccepts: [String],
    },
    preferences: {
        extra_prompt: {
            label: "Prompt adicional",
            input: "texto",
            onlyAccepts: [String],
        },
        action_timing: {
            label: "Segundos para enviar partes da ação",
            input: "número",
            onlyAccepts: [Number],
        },
        global_palpites: {
            label: "Responder jogadores com IA",
            input: "booleano",
            onlyAccepts: [Boolean],
        },
        days_to_year: {
            label: "Dias para passar um ano",
            input: "número",
            onlyAccepts: [Number],
        },
        min_event_length: {
            label: "Mínimo de caracteres de evento",
            input: "número",
            onlyAccepts: [Number],
        },
        min_action_length: {
            label: "Mínimo de caracteres de ação",
            input: "número",
            onlyAccepts: [Number],
        },
        min_diplomacy_length: {
            label: "Mínimo de caracteres de diplomacia",
            input: "número",
            onlyAccepts: [Number],
        },
    },
    roles: {
        player: {
            label: "Cargo de jogador",
            input: "cargo",
            onlyAccepts: [Role],
        },
        non_player: {
            label: "Cargo de não jogador",
            input: "cargo",
            onlyAccepts: [Role],
        },
    },
    channels: {
        staff: {
            label: "Canal da administração",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText],
        },
        logs: {
            label: "Canal de registros",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText],
        },
        context: {
            label: "Canal da memória do bot",
            input: "canal",
            onlyAccepts: [ChannelType.GuildForum],
        },
        actions: {
            label: "Canais de ações",
            input: "canal",
            array: true,
            onlyAccepts: [ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildCategory, ChannelType.GuildAnnouncement],
        },
        diplomacy: {
            label: "Diplomacia",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText]
        },
        events: {
            label: "Canais de eventos",
            input: "canal",
            array: true,
            onlyAccepts: [ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildCategory, ChannelType.GuildAnnouncement],
        },
        war: {
            label: "Canal de guerra",
            input: "canal",
            onlyAccepts: [ChannelType.GuildForum],
        },
        narrations: {
            label: "Canal de narrações",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        },
        time: {
            label: "Canal de passagem do tempo",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
        },
        secret_actions: {
            label: "Canal de ações secretas",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText],
        },
        secret_actions_log: {
            label: "Canal administrativo de ações secretas",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText],
        },
        country_category: {
            label: "Categoria de chat dos países",
            input: "canal",
            onlyAccepts: [ChannelType.GuildCategory]
        },
        country_picking: {
            label: "Canal de escolha de país",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText]
        },
        picked_countries: {
            label: "Canal de países escolhidos",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText]
        },
        npc_random_actions: {
            label: "NPC - Ações aleatórias",
            input: "canal",
            onlyAccepts: [ChannelType.GuildText]
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