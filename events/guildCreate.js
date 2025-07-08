import deploy_commands from "../src/deploy_commands.js";
import client from "../src/client.js";
import config from "../src/config.js";
import setup from "../src/setup.js";
import { ChannelType, Guild } from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import bot_config from "../config.json" with { type: "json" };
import 'dotenv/config';

export default {
    name: 'guildCreate',

    /**
     * @param {Guild} guild 
     */
    async execute(guild) {
        deploy_commands(guild.id);

        const server_config = await config(guild.id);
        const server_setup = !server_config && await setup(guild.id);

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

        if((!server_config && (!server_setup || server_setup.server_tier==0)) || server_config.server_tier==0) {
            const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has("CREATE_INSTANT_INVITE"));
            const invite = (await guild.invites.fetch())?.first()?.url || (await channel?.createInvite({ maxAge: 0, maxUses: 1 }))?.url || `Não achei um convite do servidor, mas o ID é ${guild.id}`;
            (await client.users.fetch(bot_config.owners[0])).send(`# Entra aí pra dar uma olhada.\nO ${bot_config.name} foi adicionado em um servidor que não pagou ainda, é melhor você ir dar uma olhada.\n> ${invite}`);
        }
    }
};
