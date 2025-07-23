import { 
    SnowflakeUtil 
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

        const server_config = await client.db('Salazar').collection('configuration').findOne({ server_id: serverId });
        const plainObject = server_config ? JSON.parse(JSON.stringify(server_config)) : undefined;

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

        const server_config = await client.db('Salazar').collection('setup').findOne({ server_id: serverId });
        const plainObject = server_config ? JSON.parse(JSON.stringify(server_config)) : undefined;

        return plainObject || undefined;

    } catch(err) {
        return undefined;
    } finally {
        await client.close();
    }
}