import { 
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
            array: true,
        },
        events: {
            label: "Canais de eventos",
            input: "canal",
            array: true,
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
        npc_random_actions: {
            label: "NPC - Ações aleatórias",
            input: "canal",
        },
        npc_diplomacy: {
            label: "NPC - Diplomacia",
            input: "canal",
        },
    },
    experiments: {
        disable_year_summary: {
            label: "(Experimento) Desativar sumário anual",
            input: "booleano",
        }
    }
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