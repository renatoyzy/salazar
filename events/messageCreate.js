import { 
    Message, 
    EmbedBuilder, 
    Colors, 
    PermissionsBitField,
    WebhookClient
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import botConfig from "../config.json" with { type: "json" };
import * as Server from "../src/Server.js";
import client from "../src/Client.js";
import "dotenv/config";
import { getAllPlayers, getContext, getCurrentDate } from "../src/Roleplay.js";
import { aiGenerate, isLikelyAI } from "../src/AIUtils.js";
import { simplifyString, chunkifyText } from "../src/StringUtils.js";
import gis from "g-i-s";

const collectingUsers = new Set();
const collectingAdmins = new Set();

export default {
    name: 'messageCreate',

    /**
     * @param {Message} message 
     */
    async execute(message) {
        if (message.author.bot || message.author.id === botConfig.id) return;

        const serverConfig = await Server.config(message.guildId);
        const server_setup = !serverConfig && await Server.setup(message.guildId);

        // Aviso de servidor não configurado
        if((botConfig.owners.includes(message.author.id) || message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) && !serverConfig) {
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
                    `Configure o ${botConfig.name} para iniciar os trabalhos!`,
                    '## Narração automatizada',
                    'Não perca tempo com o trabalho difícil que é narrar um roleplay. Agora, você tem uma IA a sua disposição para isso!',
                    '## Features secundárias',
                    '- Adicione bandeiras arredondadas automaticamente com o **/gerar bandeira**',
                    '- Defina um canal de ações secretas, para que somente a staff possa narrar, sem outros jogadores bisbilhotarem',
                    '## Preço baixo',
                    'Planos diferentes para o quão completo você quiser o seu servidor'
                ].join('\n');

                if(server_setup && server_setup.server_tier>0 && server_setup.server_setup_step==0) { // pago ja
                    message.reply(`${defaultMessage}\n-# Como você já fez o pagamento, pode começar a configuração do servidor o quanto antes com o comando **/setup**, ou pedir para outro administrador fazer. Assim que concluído, o ${botConfig.name} está operando no seu servidor!   `);
                } else if(server_setup && server_setup.server_tier==0 && server_setup.server_setup_step==0 || !server_setup) { // n pago nao
                    message.reply(`${defaultMessage}\n-# Não foi detectado pagamento para esse servidor... Entre em contato com o meu dono se você quiser começar a configurar o ${botConfig.name}.`);
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
        if (message.member?.roles?.cache.has(serverConfig?.server?.roles?.player) && message.channelId == serverConfig?.server?.channels?.secret_actions) {
            message.guild.channels.cache.get(serverConfig?.server?.channels?.secret_actions_log)?.send({
                embeds: [
                    new EmbedBuilder()
                    .setTitle(`Nova ação secreta de ${message.member.displayName}`)
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
        else if (
            (
                message.cleanContent.length >= process.env.MIN_ACTION_LENGTH || 
                simplifyString(message.cleanContent).includes("acao: ")
            ) 
            &&
            !simplifyString(message.cleanContent).includes('nao narr')
            &&
            !collectingUsers.has(message.author.id)
            &&
            (
                serverConfig?.server?.channels?.actions?.includes(message.channelId) ||
                serverConfig?.server?.channels?.actions?.includes(message.channel?.parentId) ||
                serverConfig?.server?.channels?.country_category == message.channel?.parent?.id ||
                serverConfig?.server?.channels?.country_category == message.channel?.parent?.parent?.id
            )
        ) {
            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e essa ação não será narrada. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg.deletable && msg.delete(), 5000));
            
            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (serverConfig?.server?.action_timing * 1000) || 20_000 });
            
            collectingUsers.add(message.author.id);

            message.react('📝')
            .catch(() => {})
            .then((reaction) => {
                setTimeout(() => {
                    reaction.remove().catch(() => {}); 
                }, (serverConfig?.server?.action_timing * 1000) || 20_000);
            })

            message.reply(`-# A partir de agora, você pode começar a enviar as outras partes da sua ação. Envie todas as partes da sua ação <t:${Math.floor((new Date().getTime() + ((serverConfig?.server?.action_timing * 1000) || 20_000))/1000)}:R>`).then(async (msg) => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, (serverConfig?.server?.action_timing * 1000) || 20_000);
            
                const actionPlayer = message.member.displayName;
                const actionContext = await getContext(message.guild);
                const serverRoleplayDate = await getCurrentDate(message.guild);
                const serverOwnedCountries = await getAllPlayers(message.guild);
                const extraPrompt = serverConfig?.server?.extra_prompt || '';

                collector.on('collect', msg => {
                    msg.react('📝')
                    .catch(() => {})
                    .then((reaction) => {
                        setTimeout(() => {
                            reaction.remove().catch(() => {}); 
                        }, (serverConfig?.server?.action_timing * 1000) || 20_000);
                    })
                });

                collector.on('end', async (collected) => {
                    collectingUsers.delete(message.author.id);
                    const acao = message.cleanContent+"\n"+collected.map(m => m.cleanContent).join("\n");

                    if(isLikelyAI(acao)) return msg.edit('-# Foi detectado um teor alto de uso de IA na sua ação. De IA já basta eu. Envie sua ação em um chat de narração humana, ou reescreva ela manualmente.');

                    msg.edit('-# Gerando narração...');

                    const prompt = eval("`" + process.env.PROMPT_NARRATION + "`");

                    console.log(`- Ação sendo narrada em ${message.guild.name} (${message.guildId})`);

                    const response = await aiGenerate(prompt).catch(error => {
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

                    let finaltext = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${mainText}`;
                    const chunks = chunkifyText(finaltext);
                    if (diffChunk) chunks.push(diffChunk);
                    chunks.push(`\n-# Narração gerada por Inteligência Artificial. [Saiba mais](${botConfig.site})`);

                    const narrationsChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.narrations);
                    
                    if (
                        serverConfig?.server?.channels?.countries_category == (message.channel?.parent?.id) ||
                        serverConfig?.server?.channels?.countries_category == (message.channel?.parent?.parent?.id)
                    ) {
                        chunks.forEach(chunk => {
                            narrationsChannel?.send(chunk);
                        });
                    } else {
                        chunks.forEach(chunk => {
                            message.channel?.send(chunk);
                        });
                    } 

                    const contexto_prompt = eval("`" + process.env.PROMPT_CONTEXT + "`");

                    const novoContexto = await aiGenerate(contexto_prompt).catch(error => {
                        console.error("Erro ao gerar contexto:", error);
                    });

                    message.guild.channels.cache.get(serverConfig?.server?.channels?.context)?.send(novoContexto.text).then(() => {
                        msg.delete();
                    });

                });

            });
        }

        // Contextualização e eventos
        else if (
            message.cleanContent.length >= process.env.MIN_EVENT_LENGTH &&
            !message.author.bot &&
            message.author.id !== botConfig.id &&
            (
                serverConfig?.server?.channels?.events?.includes(message.channelId) ||
                serverConfig?.server?.channels?.events?.includes(message.channel?.parentId)
            )
            &&
            !collectingAdmins.has(message.author.id)
        ) {

            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e não produzirá contexto para esse evento. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg.deletable && msg.delete(), 5000));

            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (serverConfig?.server?.action_timing * 1000) || 20_000 });
            
            collectingAdmins.add(message.author.id);

            message.react('📝')
            .catch(() => {})
            .then((reaction) => {
                setTimeout(() => {
                    reaction.remove().catch(() => {}); 
                }, (serverConfig?.server?.action_timing * 1000) || 20_000);
            })

            message.reply(`-# A partir de agora, você pode começar a enviar as outras partes do evento. Envie todas as partes desse evento <t:${Math.floor((new Date().getTime() + ((serverConfig?.server?.action_timing * 1000) || 20_000))/1000)}:R>`).then(async (msg) => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, (serverConfig?.server?.action_timing * 1000) || 20_000);

                const eventContext = await getContext(message.guild);
                const serverRoleplayDate = await getCurrentDate(message.guild);
                const serverOwnedCountries = await getAllPlayers(message.guild);

                collector.on('collect', msg => {
                    msg.react('📝')
                    .catch(() => {})
                    .then((reaction) => {
                        setTimeout(() => {
                            reaction.remove().catch(() => {}); 
                        }, (serverConfig?.server?.action_timing * 1000) || 20_000);
                    })
                });

                collector.on('end', async (collected) => {
                    collectingAdmins.delete(message.author.id);
                    const evento = message.cleanContent+"\n"+collected.map(m => m.cleanContent).join("\n");

                    msg.edit('-# Gerando narração...');

                    const prompt = eval("`" + process.env.PROMPT_EVENT + "`");

                    console.log(`- Evento contextualizado em ${message.guild.name} (${message.guildId})`);

                    const response = await aiGenerate(prompt).catch(error => {
                        console.error("Erro ao gerar contexto de evento:", error);
                    });

                    if (response.text === "IRRELEVANTE!!!") return;

                    message.guild.channels.cache.get(serverConfig?.server?.channels?.context)?.send(response.text);

                });

            });

        }

        // Passagem de ano
        else if (message.channelId === serverConfig?.server?.channels?.time) {
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

            serverConfig?.server?.name?.includes('{ano}') && await message.guild.setName(`${serverConfig?.server?.name?.replace('{ano}', ano)}`);

            if(!serverConfig?.server?.experiments?.disable_year_summary) {
                const actionContext = await getContext(message.guild);
                const periodo_anterior = (await (await message.guild.channels.fetch(serverConfig?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';
                const periodo_atual = simplifyString(message.cleanContent);

                const prompt = eval("`" + process.env.PROMPT_YEAR_SUMMARY + "`");

                console.log(`- O período está sendo passado em ${message.guild.name} (${message.guildId})`);

                const response = await aiGenerate(prompt).catch(error => {
                    console.error("Erro ao gerar resumo de período:", error);
                });

                const contextChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.context);
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
            };

            contextChannel.send(`# ${message.cleanContent}\nTodo o contexto a seguir pertence ao ano de ${ano}.`);
        }

        // Interação com NPC
        else if (
            serverConfig?.server?.channels?.npc_diplomacy?.includes(message.channelId) &&
            message.content.length >= process.env.MIN_DIPLOMACY_LENGTH
        ) {

            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e essa ação não será analisada. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg.deletable && msg.delete(), 5000));

            message.reply('-# Analisando ação...').then(async msg => {

                const acao = message.cleanContent;
                const actionContext = await getContext(message.guild);
                const actionPlayer = message.member.displayName;
                const serverRoleplayDate = await getCurrentDate(message.guild);
                const serverOwnedCountries = await getAllPlayers(message.guild);

                const prompt = eval("`" + process.env.PROMPT_NPC_DIPLOMACY + "`");

                console.log(`- Diplomacia NPC de ${message.author.username} sendo narrada em ${message.guild.name} (${message.guildId})`);

                const response = await aiGenerate(prompt).catch(error => {
                    console.error("Erro ao gerar contexto de evento:", error);
                });

                const json = JSON.parse("{"+response.text.split("{")[1].split("}")[0]+"}");

                if(!json || !json['pais'] || !json['resposta']) return console.error(response.text);

                if(simplifyString(json['resposta']) !== 'nao') {

                    await gis(`Bandeira ${json['pais']} ${serverRoleplayDate}`, async (error, results) => {
                        
                        const validResult = results[0];

                        let webhookContent = {
                            username: json['pais'],
                            content: json['resposta'] + `\n<@${message.author.id}>`,
                        };

                        if(validResult) webhookContent['avatarURL'] = validResult?.url

                        const webhookUrl = (await message.channel.fetchWebhooks()).find(w => w.owner == client.user.id) ? 
                            (await message.channel.fetchWebhooks()).find(w => w.owner == client.user.id).url
                        :
                            (await message.channel.createWebhook({name: 'Webhook do salazar'})).url

                        const webhookClient = new WebhookClient({ url: webhookUrl });

                        await webhookClient.send(webhookContent);

                        const contexto_prompt = eval("`" + process.env.PROMPT_NPC_DIPLOMACY_CONTEXT + "`");

                        const novoContexto = await aiGenerate(contexto_prompt).catch(error => {
                            console.error("Erro ao gerar contexto:", error);
                        });

                        message.guild.channels.cache.get(serverConfig?.server?.channels?.context)?.send(novoContexto.text);

                    });

                } else {
                    console.log('-- '+json['pais']);
                }

                msg?.deletable && msg.delete();

            });

        }
    }
};
