import { 
    SnowflakeUtil 
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

/**
 * Retorna o setup do servidor no banco de dados (ou undefined)
 * @param {SnowflakeUtil} serverId 
 * @returns {{} | undefined} Objeto do setup do servidor (ou undefined se não existirem)
 */
export default async function setup(serverId) {
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
