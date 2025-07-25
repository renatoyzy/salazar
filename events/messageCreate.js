import { 
    Message, 
    EmbedBuilder, 
    Colors, 
    PermissionsBitField, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import bot_config from "../config.json" with { type: "json" };
import { config, setup } from "../src/server_info.js";
import client from "../src/client.js";
import "dotenv/config";
import { GetContext } from "../src/roleplay.js";
import ai_generate from "../src/ai_generate.js";
import { simplifyString, chunkifyText } from "../src/string_functions.js";

const collectingUsers = new Set();

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
        else if ((message.cleanContent.length >= 500 || message.content.toLowerCase().includes("ação: ")) &&
            !collectingUsers.has(message.author.id) && (
                server_config?.server?.channels?.actions?.includes(message.channelId) ||
                server_config?.server?.channels?.actions?.includes(message.channel?.parentId) ||
                server_config?.server?.channels?.countries_category?.includes(message.channelId) ||
                server_config?.server?.channels?.countries_category?.includes(message.channel?.parentId) ||
                server_config?.server?.channels?.countries_category?.includes(message.channel?.parent?.parentId)
            )
        ) {
            if(process.env.MAINTENANCE) return message.reply(`-# O ${bot_config.name} está em manutenção e essa ação não será narrada.`).then(msg => setTimeout(() => msg.delete(), 5000));
            
            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (server_config?.server?.action_timing * 1000) || 20_000 });
            
            collectingUsers.add(message.author.id);

            message.react('📝')
            .catch(() => {})
            .then((reaction) => {
                setTimeout(() => {
                    reaction.remove().catch(() => {}); 
                }, (server_config?.server?.action_timing * 1000) || 20_000);
            })

            message.reply(`-# A partir de agora, você pode começar a enviar as outras partes da sua ação. Envie todas as partes da sua ação <t:${Math.floor((new Date().getTime() + ((server_config?.server?.action_timing * 1000) || 20_000))/1000)}:R>`).then(async (msg) => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, (server_config?.server?.action_timing * 1000) || 20_000);
            
                const acao_jogador = message.author.displayName;
                const acao_contexto = await GetContext(message.guild);
                const servidor_data_roleplay = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';
                const prompt_adicional = server_config?.server?.extra_prompt || '';

                collector.on('collect', msg => {
                    msg.react('📝')
                    .catch(() => {})
                    .then((reaction) => {
                        setTimeout(() => {
                            reaction.remove().catch(() => {}); 
                        }, (server_config?.server?.action_timing * 1000) || 20_000);
                    })
                });

                collector.on('end', async (collected) => {
                    collectingUsers.delete(message.author.id);
                    const acao = message.cleanContent+"\n"+collected.map(m => m.cleanContent).join("\n");

                    msg.edit('-# Gerando narração...');

                    const prompt = eval("`" + process.env.PROMPT_NARRATION + "`");

                    console.log(`- Ação sendo narrada em ${message.guild.name} (${message.guildId})`);

                    const response = await ai_generate(prompt).catch(error => {
                        console.error("Erro ao gerar narração:", error);
                    });

                    if (response.text === "IRRELEVANTE!!!") {
                        return msg.delete();
                    }

                    // Se houver bloco diff, ele fica em um chunk separado
                    const diffStart = response.text.indexOf('```diff');
                    let mainText = response.text;
                    let diffChunk = null;
                    if (diffStart !== -1) {
                        mainText = response.text.slice(0, diffStart);
                        diffChunk = response.text.slice(diffStart);
                    }

                    const max_length = 2000;
                    let finaltext = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${mainText}`;
                    const chunks = chunkifyText(finaltext);
                    if (diffChunk) chunks.push(diffChunk);
                    chunks.push(`\n-# Narração gerada por Inteligência Artificial. [Saiba mais](${bot_config.site})`);

                    const narrationsChannel = message.guild.channels.cache.get(server_config?.server?.channels?.narrations);
                    chunks.forEach(chunk => {
                        narrationsChannel?.send(chunk);
                    });

                    const contexto_prompt = eval("`" + process.env.PROMPT_CONTEXT + "`");

                    const novo_contexto = await ai_generate(contexto_prompt).catch(error => {
                        console.error("Erro ao gerar contexto:", error);
                    });

                    message.guild.channels.cache.get(server_config?.server?.channels?.context)?.send(novo_contexto.text).then(() => {
                        msg.delete();
                    });

                });

            });
        }

        // Contextualização e eventos
        else if (
            message.cleanContent.length >= 300 &&
            !message.author.bot &&
            message.author.id !== bot_config.id &&
            (
                server_config?.server?.channels?.events?.includes(message.channelId) ||
                server_config?.server?.channels?.events?.includes(message.channel?.parentId)
            )
        ) {
            const acao_contexto = await GetContext(message.guild);
            const servidor_data_roleplay = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';

            const prompt = eval("`" + process.env.PROMPT_EVENT + "`");

            console.log(`- Evento contextualizado em ${message.guild.name} (${message.guildId})`);

            const response = await ai_generate(prompt).catch(error => {
                console.error("Erro ao gerar contexto de evento:", error);
            });

            if (response.text === "IRRELEVANTE!!!") return;

            message.guild.channels.cache.get(server_config?.server?.channels?.context)?.send(response.text);
        }

        // Passagem de ano
        else if (message.channelId === server_config?.server?.channels?.time) {
            const ano = parseInt(message.cleanContent.match(/\d+/)?.[0]);
            const ano_atual = parseInt(message.guild.name.match(/\d+/)?.[0]);
            if (!ano) return;

            // Detecta se o período é um ano completo ou parcial
            let periodoCompleto = false;
            // Exemplo: se a mensagem contém "fim do ano" ou "final do ano" ou "ano completo"
            if (/\b(fim|final) do ano\b|ano completo/i.test(message.cleanContent)) {
                periodoCompleto = true;
            } else if (ano_atual && ano !== ano_atual) {
                // Se o ano mudou, provavelmente é um ano completo
                periodoCompleto = true;
            } else if (/\bsemestre|trimestre|bimestre|mes(es)?|período|parcial/i.test(message.cleanContent)) {
                periodoCompleto = false;
            }

            server_config?.server?.name?.includes('{ano}') && await message.guild.setName(`${server_config?.server?.name?.replace('{ano}', ano)}`);

            const acao_contexto = await GetContext(message.guild);
            const periodo_anterior = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';
            const periodo_atual = simplifyString(message.cleanContent);

            const prompt = eval("`" + process.env.PROMPT_YEAR_SUMMARY + "`");

            console.log(`- O período está sendo passado em ${message.guild.name} (${message.guildId})`);

            const response = await ai_generate(prompt).catch(error => {
                console.error("Erro ao gerar resumo de período:", error);
            });

            const contextChannel = message.guild.channels.cache.get(server_config?.server?.channels?.context);
            if (!contextChannel) return;

            let tituloResumo = periodoCompleto
                ? `# Resumo geral do ano de ${ano_atual}`
                : `# Resumo do período recente (${message.cleanContent.replace(/[^\d]+/g, ' ').trim()})`;
            let finaltext = `${tituloResumo}\n${response.text}`;
            const chunks = chunkifyText(finaltext, `\n-# RG-${ano_atual}`);

            const msgs = await contextChannel.messages.fetch({ limit: 100 }); // Limite máximo do bulkDelete
            const deletable = msgs.filter(msg =>
                (message.createdTimestamp - msg.createdTimestamp <= 7 * 24 * 60 * 60 * 1000) &&
                !msg.content.includes('-# RG-')
            );

            if (deletable.size > 0) {
                await contextChannel.bulkDelete(deletable, true); // true ignora mensagens antigas
            }

            chunks.forEach(chunk => contextChannel.send(chunk));
            contextChannel.send(`# ${message.cleanContent}\nTodo o contexto a seguir pertence ao ano de ${ano}.`);
        }
    }
};
