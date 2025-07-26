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
    const serverConfig = await Server.config(serverId);
    const server_setup = !serverConfig && await Server.setup(serverId);

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