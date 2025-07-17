import { 
    Message, 
    EmbedBuilder, 
    Colors, 
    PermissionsBitField 
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import bot_config from "../config.json" with { type: "json" };
import { config, setup } from "../src/server_info.js";
import client from "../src/client.js";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export default {
    name: 'messageCreate',

    /**
     * @param {Message} message 
     */
    async execute(message) {
        if (message.author.bot || message.author.id === bot_config.id) return;
        const server_config = await config(message.guildId);
        const server_setup = !server_config && await setup(message.guildId);

        // Aviso de servidor não configurado
        if((bot_config.owners.includes(message.author.id) || message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) && !server_config) {
            const mongoClient = new MongoClient(process.env.DB_URI, {
                serverApi: {
                    version: ServerApiVersion.v1,
                    strict: true,
                    deprecationErrors: true,
                },
            });

            try {
                await mongoClient.connect();

                let defaultMessage = [
                    '# Obrigado por me adicionar!',
                    `Configure o ${bot_config.name} para iniciar os trabalhos!`,
                    '## Narração automatizada',
                    'Não perca tempo com o trabalho difícil que é narrar um roleplay. Agora, você tem uma IA a sua disposição para isso!',
                    '## Features secundárias',
                    '- Adicione bandeiras arredondadas automaticamente com o **/gerar bandeira**',
                    '- Defina um canal de ações secretas, para que somente a staff possa narrar, sem outros jogadores bisbilhotarem',
                    '## Preço baixo',
                    'Planos diferentes para o quão completo você quiser o seu servidor'
                ].join('\n');

                if(server_setup && server_setup.server_tier>0 && server_setup.server_setup_step==0) { // pago ja
                    message.reply(`${defaultMessage}\n-# Como você já fez o pagamento, pode começar a configuração do servidor o quanto antes com o comando **/setup**, ou pedir para outro administrador fazer. Assim que concluído, o ${bot_config.name} está operando no seu servidor!   `);
                } else if(server_setup && server_setup.server_tier==0 && server_setup.server_setup_step==0 || !server_setup) { // n pago nao
                    message.reply(`${defaultMessage}\n-# Não foi detectado pagamento para esse servidor... Entre em contato com o meu dono se você quiser começar a configurar o ${bot_config.name}.`);
                }

                server_setup ? 
                    await mongoClient.db('Salazar').collection('setup').findOneAndUpdate({ server_id: message.guildId }, { $set: { server_setup_step: 1 } })
                :
                    await mongoClient.db('Salazar').collection('setup').insertOne({
                        server_id: message.guildId,
                        server_tier: 0,
                        server_setup_step: 1,
                        server: {}
                    })

            } catch {} finally {
                await mongoClient.close();
            }
        };

        // Ações secretas
        if (message.member?.roles?.cache.has(server_config?.server?.roles?.player) && message.channelId == server_config?.server?.channels?.secret_actions) {
            message.guild.channels.cache.get(server_config?.server?.channels?.secret_actions_log)?.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Nova ação secreta de ${message.author.displayName}`)
                    .setThumbnail(message.author.avatarURL())
                    .setDescription(message.content)
                    .setColor(Colors.Blurple)
                    .setTimestamp(Date.now())
                ]
            }).then(() => {
                message.delete().catch(() => {});
            }).catch(() => {});
        }

        // Narração de IA
        else if (message.cleanContent.length >= 500 && (
            server_config?.server?.channels?.actions?.includes(message.channelId) ||
            server_config?.server?.channels?.actions?.includes(message.channel?.parentId)
        )) {
            message.reply('-# Gerando narração...').then(async (msg) => {
                const acao_jogador = message.author.displayName;
                const acao_contexto = (await message.guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
                    ?.sort()
                    ?.map(msg => msg.content)
                    ?.join('\n\n');
                const acao = message.cleanContent;
                const servidor_data_roleplay = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';

                const prompt = eval("`" + process.env.PROMPT_NARRATION + "`");

                const response = await ai.models.generateContent({
                    model: bot_config.model,
                    contents: prompt
                });

                if (response.text === "IRRELEVANTE!!!") {
                    return msg.delete();
                }

                const max_length = 2000;
                let finaltext = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${response.text}\n-# Gerado por Inteligência Artificial`;
                const chunks = [];
                for (let i = 0; i < finaltext.length; i += max_length) {
                    chunks.push(finaltext.slice(i, i + max_length));
                }

                chunks.forEach(chunk => {
                    message.guild.channels.cache.get(server_config?.server?.channels?.narrations)?.send(chunk);
                });

                const contexto_prompt = eval("`" + process.env.PROMPT_CONTEXT + "`");

                const novo_contexto = await ai.models.generateContent({
                    model: bot_config.model,
                    contents: contexto_prompt
                });

                message.guild.channels.cache.get(server_config?.server?.channels?.context)?.send(novo_contexto.text).then(() => {
                    msg.delete();
                });
            });
        }

        // Contextualização e eventos
        else if (
            message.cleanContent.length >= 300 &&
            !message.author.bot &&
            message.author.id !== bot_config.id &&
            (server_config?.server?.channels?.events?.includes(message.channelId) ||
                server_config?.server?.channels?.events?.includes(message.channel?.parentId))
        ) {
            const acao_contexto = (await message.guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
                ?.sort()
                ?.map(msg => msg.content)
                ?.join('\n\n');
            const servidor_data_roleplay = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';

            const prompt = eval("`" + process.env.PROMPT_EVENT + "`");

            const response = await ai.models.generateContent({
                model: bot_config.model,
                contents: prompt
            });

            if (response.text === "IRRELEVANTE!!!") return;

            message.guild.channels.cache.get(server_config?.server?.channels?.context)?.send(response.text);
        }

        // Passagem de ano
        else if (message.channelId === server_config?.server?.channels?.time) {
            const ano = parseInt(message.cleanContent.match(/\d+/)?.[0]);
            const ano_atual = parseInt(message.guild.name.match(/\d+/)?.[0]);
            if (!ano) return;

            server_config?.server?.name?.includes('{ano}') && await message.guild.setName(`${server_config?.server?.name?.replace('{ano}', ano)}`);

            const acao_contexto = (await message.guild.channels.cache.get(server_config?.server?.channels?.context)?.messages?.fetch())
                ?.sort()
                ?.map(msg => msg.content)
                ?.join('\n\n');

            const prompt = eval("`" + process.env.PROMPT_YEAR_SUMMARY + "`");

            const response = await ai.models.generateContent({
                model: bot_config.model,
                contents: prompt
            });

            const contextChannel = message.guild.channels.cache.get(server_config?.server?.channels?.context);
            if (!contextChannel) return;

            const max_length = 2000;
            let finaltext = `# Resumo geral de ${ano_atual}\n${response.text}`;
            const chunks = [];
            for (let i = 0; i < finaltext.length; i += max_length) {
                chunks.push(finaltext.slice(i, i + max_length));
            }

            const msgs = await contextChannel.messages.fetch();
            msgs.filter(msg => 
                msg.author.id === bot_config.id &&
                (message.createdTimestamp - msg.createdTimestamp <= 7 * 24 * 60 * 60 * 1000) &&
                !msg.content.includes('# Resumo geral ')
            ).forEach(msg => msg.delete());

            chunks.forEach(chunk => contextChannel.send(chunk));
            contextChannel.send(`# ${message.cleanContent}\nTodo o contexto a seguir pertence ao ano de ${ano}.`);
        }
    }
};
