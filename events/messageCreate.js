import { 
    Message, 
    EmbedBuilder, 
    Colors, 
    PermissionsBitField,
    WebhookClient,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { 
    MongoClient, 
    ServerApiVersion 
} from "mongodb";
import botConfig from "../config.json" with { type: "json" };
import * as Server from "../src/Server.js";
import client from "../src/Client.js";
import "dotenv/config";
import {
    addContext,
    getAllPlayers,
    getContext,
    getCurrentDate,
    getWars
} from "../src/Roleplay.js";
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
        const serverSetup = !serverConfig && await Server.setup(message.guildId);

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

                if(serverSetup && serverSetup.server_tier>0 && serverSetup.server_setup_step==0) { // pago ja
                    message.reply(`${defaultMessage}\n-# Como você já fez o pagamento, pode começar a configuração do servidor o quanto antes com o comando **/setup**, ou pedir para outro administrador fazer. Assim que concluído, o ${botConfig.name} está operando no seu servidor!   `);
                } else if(serverSetup && serverSetup.server_tier==0 && serverSetup.server_setup_step==0 || !serverSetup) { // n pago nao
                    message.reply(`${defaultMessage}\n-# Não foi detectado pagamento para esse servidor... Entre em contato com o meu dono se você quiser começar a configurar o ${botConfig.name}.`);
                }

                serverSetup ? 
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
                simplifyString(message.cleanContent).includes("acao")
            ) 
            &&
            !(simplifyString(message.cleanContent).includes('nao narr'))
            &&
            !collectingUsers.has(message.author.id)
            &&
            (
                serverConfig?.server?.channels?.actions?.includes(message.channelId) ||
                serverConfig?.server?.channels?.actions?.includes(message.channel?.parentId) ||
                serverConfig?.server?.channels?.country_category == message.channel?.parent?.id ||
                serverConfig?.server?.channels?.country_category == message.channel?.parent?.parent?.id
            )
            &&
            (
                message.channel.type == ChannelType.GuildText || 
                message.channel.type == ChannelType.PublicThread
            )
        ) {
            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e essa ação não será narrada. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg?.deletable && msg.delete(), 5000));

            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (serverConfig?.server?.action_timing * 1000) || 20_000 });
            
            collector.on('collect', msg => {
                msg.react('📝').catch(() => {});
            });

            collectingUsers.add(message.author.id);

            message.react('📝').catch(() => {});

            const waitMessage = await message.reply(`-# A partir de agora, você pode começar a enviar as outras partes da sua ação. Envie todas as partes da sua ação <t:${Math.floor((new Date().getTime() + ((serverConfig?.server?.action_timing * 1000) || 20_000))/1000)}:R>. Se sua ação não for dividida em múltiplas partes, apenas aguarde o tempo acabar.`);

            const actionPlayer = message.member.displayName;
            const actionContext = await getContext(message.guild);
            const serverRoleplayDate = await getCurrentDate(message.guild);
            const serverOwnedCountries = await getAllPlayers(message.guild);
            const extraPrompt = serverConfig?.server?.extra_prompt || '';

            collector.on('end', async (collected) => {
                collectingUsers.delete(message.author.id);
                const action = message.cleanContent+"\n"+collected.map(msg => msg.cleanContent).join("\n");

                if(isLikelyAI(action)) return waitMessage.edit('-# Foi detectado um teor alto de uso de IA na sua ação. De IA já basta eu. Envie sua ação em um chat de narração humana, ou reescreva ela manualmente.');

                waitMessage.edit('-# Gerando narração...');

                const prompt = eval("`" + process.env.PROMPT_NARRATION + "`");

                console.log(`- Ação sendo narrada em ${message.guild.name} (${message.guildId})`);

                const response = await aiGenerate(prompt).catch(error => {
                    console.error("Erro ao gerar narração:", error);
                });

                if (simplifyString(response.text).startsWith("irrelevante")) return msg.delete();

                // Se houver bloco diff, ele fica em um chunk separado
                const diffStart = response.text.indexOf('```diff');
                let mainText = response.text;
                let diffChunk = null;
                if (diffStart !== -1) {
                    mainText = response.text.slice(0, diffStart);
                    diffChunk = response.text.slice(diffStart);
                };

                let finalText = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${mainText}`;
                const chunks = chunkifyText(finalText);
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

                collected.forEach(msg => msg.reactions.removeAll());
                message?.reactions.removeAll();
                waitMessage?.deletable && waitMessage.delete().catch(() => {});

                const contextPrompt = eval("`" + process.env.PROMPT_CONTEXT + "`");

                const newContext = await aiGenerate(contextPrompt).catch(error => {
                    console.error("Erro ao gerar contexto:", error);
                });

                await addContext(newContext.text, message.guild);

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
            &&
            (
                message.channel.type == ChannelType.GuildText ||
                message.channel.type == ChannelType.GuildAnnouncement ||
                message.channel.type == ChannelType.PublicThread
            )
        ) {

            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e não produzirá contexto para esse evento. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg.deletable && msg.delete(), 5000));

            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (serverConfig?.server?.action_timing * 1000) || 20_000 });
            
            collector.on('collect', msg => {
                msg.react('📝').catch(() => {});
            });

            collectingAdmins.add(message.author.id);

            message.react('📝').catch(() => {});

            const waitMessage = await message.reply(`-# A partir de agora, você pode começar a enviar as outras partes do evento. Envie todas as partes desse evento <t:${Math.floor((new Date().getTime() + ((serverConfig?.server?.action_timing * 1000) || 20_000))/1000)}:R>`);

            const eventContext = await getContext(message.guild);
            const serverRoleplayDate = await getCurrentDate(message.guild);
            const serverOwnedCountries = await getAllPlayers(message.guild);

            collector.on('end', async (collected) => {
                collectingAdmins.delete(message.author.id);
                const evento = message.cleanContent+"\n"+collected.map(msg => msg.cleanContent).join("\n");

                waitMessage.edit('-# Gerando contextualização...');

                const prompt = eval("`" + process.env.PROMPT_EVENT + "`");

                console.log(`- Evento contextualizado em ${message.guild.name} (${message.guildId})`);
                
                const response = await aiGenerate(prompt).catch(error => {
                    console.error("Erro ao gerar contexto de evento:", error);
                });

                collected.forEach(msg => msg.reactions.removeAll());
                message?.reactions.removeAll();
                waitMessage?.deletable && waitMessage.delete();

                if (response.text === "IRRELEVANTE!!!") return;

                addContext(response.text, message.guild);

            });


        }

        // Passagem de ano
        else if (message.channelId === serverConfig?.server?.channels?.time) {
            const newYear = parseInt(message.cleanContent.match(/\d+/)?.[0]);
            const currentYear = parseInt(message.guild.name.match(/\d+/)?.[0]);
            if (!newYear) return;

            // Detecta se o período é um ano completo ou parcial
            let fullYearPassed = false;
            // Exemplo: se a mensagem contém "fim do ano" ou "final do ano" ou "ano completo"
            if (/\b(fim|final) do ano\b|ano completo/i.test(message.cleanContent)) {
                fullYearPassed = true;
            } else if (currentYear && newYear !== currentYear) {
                // Se o ano mudou, provavelmente é um ano completo
                fullYearPassed = true;
            } else if (/\bsemestre|trimestre|bimestre|mes(es)?|período|parcial/i.test(message.cleanContent)) {
                fullYearPassed = false;
            }

            serverConfig?.server?.name?.includes('{ano}') && await message.guild.setName(`${serverConfig?.server?.name?.replace('{ano}', newYear)}`);

            const contextChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.context);
            if (!contextChannel || contextChannel.type != ChannelType.GuildForum) return;

            if(fullYearPassed) {
                contextChannel.threads.create({
                    name: newYear || currentYear,
                    message: {
                        content: `Eventos, ações e acontecimentos de ${newYear || currentYear}.`
                    }
                });
            }
        }

        // Interação com NPC e declaração de guerra
        else if (
            serverConfig?.server?.channels?.diplomacy?.includes(message.channelId) &&
            (
                message.content.length >= process.env.MIN_DIPLOMACY_LENGTH ||
                simplifyString(message.content).includes('acao')
            )
        ) {

            if(process.env.MAINTENANCE) return message.reply(`-# O ${botConfig.name} está em manutenção e essa ação não será analisada. Aguarde a finalização da manutenção e reenvie se possível.`).then(msg => setTimeout(() => msg?.deletable && msg?.delete(), 5000));

            message.reply('-# Analisando ação...').then(async msg => {

                const action = message.cleanContent;
                const actionContext = await getContext(message.guild);
                const actionPlayer = message.member.displayName;
                const serverRoleplayDate = await getCurrentDate(message.guild);
                const serverOwnedCountries = await getAllPlayers(message.guild);
                const serverCurrentWars = await getWars(message.guild);

                const prompt = eval("`" + process.env.PROMPT_DIPLOMACY + "`");

                console.log(`- Diplomacia de ${message.author.username} sendo analisada em ${message.guild.name} (${message.guildId})`);

                const response = await aiGenerate(prompt).catch(error => {
                    console.error("Erro ao gerar contexto de evento:", error);
                });

                const json = JSON.parse("{"+response.text?.split("{")[1]?.split("}")[0]+"}");

                if(
                    !json || json['tipo'] === undefined ||
                    (
                        json['tipo'] == 0 &&
                        !json['motivo'] 
                    ) || (
                        json['tipo'] == 1 &&
                        (!json['pais'] || !json['resposta'] || !json['contexto'])
                    ) || (
                        json['tipo'] == 2 &&
                        (!json['pais'] || !json['narracao'] || !json['contexto'] || !json['guerra'] || !json['sinopse'])
                    ) || (
                        json['tipo'] == 3 &&
                        (!json['pais'] || !json['narracao'] || !json['contexto'] || !json['id'] || !json['sinopse'])
                    )
                ) return console.error('Algo deu errado em análise de diplomacia: '+response.text);

                switch (json['tipo']) {
                    case 0: { // não é nada
                        console.log('-- '+json['motivo']);
                        break;
                    }

                    case 1: { // diplomacia npc
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

                            addContext(json['contexto'], message.guild);

                        });
                        break;
                    }

                    case 2: { // guerra declarada
                        
                        // Se houver bloco diff, ele fica em um chunk separado
                        const diffStart = json['narracao'].indexOf('```diff');
                        let mainText = json['narracao'];
                        let diffChunk = null;
                        if (diffStart !== -1) {
                            mainText = json['narracao'].slice(0, diffStart);
                            diffChunk = json['narracao'].slice(diffStart);
                        };

                        let finalText = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${mainText}`;
                        const chunks = chunkifyText(finalText);
                        if (diffChunk) chunks.push(diffChunk);
                        chunks.push(`\n-# Narração gerada por Inteligência Artificial. [Saiba mais](${botConfig.site})`);

                        const narrationsChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.narrations);

                        chunks.forEach(chunk => narrationsChannel?.send(chunk));

                        addContext(json['contexto'], message.guild);

                        const warChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.war);
                        if(!warChannel || warChannel.type != ChannelType.GuildForum) return;

                        warChannel.threads.create({
                            name: json['guerra'],
                            message: {
                                content: json['sinopse']
                            }
                        }).then(warThread => {
                            warThread.send({
                                embeds: [
                                    new EmbedBuilder()
                                    .setTitle('Enviar ação')
                                    .setDescription('Enviar ação')
                                ],
                                components: [
                                    new ActionRowBuilder()
                                    .addComponents([
                                        new ButtonBuilder()
                                        .setCustomId('war_action')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setLabel('Enviar ação de guerra'),
                                        new ButtonBuilder()
                                        .setCustomId('war_narrate')
                                        .setStyle(ButtonStyle.Success)
                                        .setLabel('Gerar narração')
                                    ])
                                ]
                            })
                        });
                        
                        break;
                    }
                    
                    case 3: { // alteração em guerra existente
                        // Se houver bloco diff, ele fica em um chunk separado
                        const diffStart = json['narracao'].indexOf('```diff');
                        let mainText = json['narracao'];
                        let diffChunk = null;
                        if (diffStart !== -1) {
                            mainText = json['narracao'].slice(0, diffStart);
                            diffChunk = json['narracao'].slice(diffStart);
                        };

                        let finalText = `# Ação de ${message.member.displayName}\n- Ação original: ${message.url}\n- Menções: <@${message.author.id}>\n${mainText}`;
                        const chunks = chunkifyText(finalText);
                        if (diffChunk) chunks.push(diffChunk);
                        chunks.push(`\n-# Narração gerada por Inteligência Artificial. [Saiba mais](${botConfig.site})`);

                        const narrationsChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.narrations);

                        chunks.forEach(chunk => narrationsChannel?.send(chunk));

                        addContext(json['contexto'], message.guild);

                        const warChannel = message.guild.channels.cache.get(serverConfig?.server?.channels?.war);
                        if(!warChannel || warChannel.type != ChannelType.GuildForum) return;
                        const warThread = warChannel.threads.cache.get(json['id']);
                        if(!warThread) return;
                        const warThreadStarterMessage = await warThread.fetchStarterMessage();

                        warThreadStarterMessage.editable && warThreadStarterMessage.edit(json['sinopse']);

                        break;
                    }
                
                    default:
                        break;
                }

                msg?.deletable && msg.delete();

            });

        }

        // Poluição no contexto
        else if (
            (
                serverConfig?.server?.channels?.context?.includes(message.channelId) ||
                serverConfig?.server?.channels?.context?.includes(message.channel.parentId)
            )
            &&
            (
                !message.content.includes('###') ||
                !message.content.includes('**')
            )
        ) {
            message.deletable && message.delete();
        }
    }
};
