import deploy_commands from "../src/deploy_commands.js";
import client from "../src/client.js";
import { Guild } from "discord.js";
import { MongoClient } from "mongodb";
import 'dotenv/config';

export default {
    name: 'guildCreate',

    /**
     * @param {Guild} guild 
     */
    async execute(guild) {
        deploy_commands(guild.id);

        const mongoClient = new MongoClient(process.env.DB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        try {
            await mongoClient.connect();

            await mongoClient.db('Salazar').collection('setup').insertOne({
                server_id: guild.id,
                server_tier: 0,
                server_setup_step: 0,
                server: {}
            })

        } catch {} finally {
            await mongoClient.close();
        }
    }
};
