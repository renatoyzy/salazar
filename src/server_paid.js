import { 
    SnowflakeUtil 
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import { config, setup } from "./server_info.js";
import "dotenv/config";

/**
 * Informa pagamento de um servidor
 * @param {SnowflakeUtil} serverId 
 * @param {number} tier
 * @returns {{} | undefined} Objeto das configurações do servidor (ou undefined se não existirem)
 */
export default async function server_paid(serverId, tier) {
    const server_config = await config(serverId);
    const server_setup = !server_config && await setup(serverId);

    const client = new MongoClient(process.env.DB_URI, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    try {
        await client.connect();

        return server_config ?
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