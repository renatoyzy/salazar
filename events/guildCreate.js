import client, { deployCommands } from "../src/Client.js";
import * as Server from "../src/Server.js";
import { Guild, PermissionsBitField } from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import botConfig from "../config.json" with { type: "json" };
import 'dotenv/config';

export default {
    name: 'guildCreate',

    /**
     * @param {Guild} guild 
     */
    async execute(guild) {
        deployCommands(guild.id);

        const serverConfig = await Server.config(guild.id);
        const serverSetup = !serverConfig && await Server.setup(guild.id);

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

        if((!serverConfig && (!serverSetup || serverSetup.server_tier==0)) || serverConfig.server_tier==0) {
            const channel = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite));
            const invite = (await guild.invites.fetch())?.first()?.url || (await channel?.createInvite({ maxAge: 0, maxUses: 1 }))?.url || `Não achei um convite do servidor, mas o ID é ${guild.id}`;
            (await client.users.fetch(botConfig.owners[0])).send(`# Entra aí pra dar uma olhada.\nO ${botConfig.name} foi adicionado em um servidor que não pagou ainda, é melhor você ir dar uma olhada.\n> ${invite}`);
        }
    }
};
