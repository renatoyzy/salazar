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
            collectingUsers.add(message.author.id);
            
            const filter = msg => msg.author.id == message.author.id;
            const collector = await message.channel.createMessageCollector({ filter, time: (server_config?.server?.action_timing * 1000) || 20_000 });

            message.react('📝').catch(() => {});
            setTimeout(() => {
               message?.reactions.removeAll().catch(() => {}); 
            }, (server_config?.server?.action_timing * 1000) || 20_000);

            message.reply(`-# Envie todas as partes da sua ação em até ${(server_config?.server?.action_timing) || 20} segundos.`).then(async (msg) => {
                setTimeout(() => {
                    msg.delete().catch(() => {});
                }, (server_config?.server?.action_timing * 1000) || 20_000);
            
                const acao_jogador = message.author.displayName;
                const acao_contexto = await GetContext(message.guild);
                const servidor_data_roleplay = (await (await message.guild.channels.fetch(server_config?.server?.channels?.time)).messages.fetch()).first() || 'ignore essa linha, não encontrei a data atual do servidor';
                const prompt_adicional = server_config?.server?.extra_prompt || '';

                collector.on('collect', msg => {
                    msg.react('📝');
                    setTimeout(() => {
                        msg?.reactions.removeAll().catch(() => {});
                    }, (server_config?.server?.action_timing * 1000) || 20_000);
                });

                collector.on('end', async (collected) => {
                    collectingUsers.delete(message.author.id);
                    const acao = message.cleanContent+"\n"+collected.map(m => m.cleanContent).join("\n");

                    msg.edit('-# Gerando narração...');

                    const prompt = eval("`" + process.env.PROMPT_NARRATION + "`");

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
                    const chunks = [];
                    for (let i = 0; i < finaltext.length; i += max_length) {
                        chunks.push(finaltext.slice(i, i + max_length));
                    }
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

            const prompt = eval("`" + process.env.PROMPT_YEAR_SUMMARY + "`");

            const response = await ai_generate(prompt).catch(error => {
                console.error("Erro ao gerar resumo de período:", error);
            });

            const contextChannel = message.guild.channels.cache.get(server_config?.server?.channels?.context);
            if (!contextChannel) return;

            const max_length = 1989; // 2000 - 11 (para o "-# RG-2023" no final)
            let tituloResumo = periodoCompleto
                ? `# Resumo geral do ano de ${ano_atual}`
                : `# Resumo do período recente (${message.cleanContent.replace(/[^\d]+/g, ' ').trim()})`;
            let finaltext = `${tituloResumo}\n${response.text}`;
            const chunks = [];
            for (let i = 0; i < finaltext.length; i += max_length) {
                chunks.push(finaltext.slice(i, i + max_length) + `\n-# RG-${ano_atual}`);
            }

            const msgs = await contextChannel.messages.fetch();
            msgs.filter(msg => 
                msg.author.id === bot_config.id &&
                (message.createdTimestamp - msg.createdTimestamp <= 7 * 24 * 60 * 60 * 1000) &&
                !msg.content.includes('-# RG') &&
                !msg.content.includes('# Resumo geral de')
            ).forEach(msg => msg.delete());

            chunks.forEach(chunk => contextChannel.send(chunk));
            contextChannel.send(`# ${message.cleanContent}\nTodo o contexto a seguir pertence ao ano de ${ano}.`);
        }

        // Seleção de país
        else if (server_config.server_tier>=2 && message.channelId === server_config?.server?.channels?.country_picking) {
            const country = message.cleanContent.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z ]/g, '');
            if (!country) return;

            const countryCategory = message.guild.channels.cache.get(server_config?.server?.channels?.country_category);
            
            const existingChannel = countryCategory?.children?.cache.find(c => c.name.replaceAll("-", " ").normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z ]/g, '').includes(country.toLowerCase()));
            const existingRole = message.guild.roles.cache.find(r => r.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z ]/g, '').includes(country.toLowerCase()));
            
            let replyEmbed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(`${message.author.displayName} escolheu o país ${message.cleanContent.trim()}`)
            .setFooter({text: "Aguarde ou peça para que algum administrador aprove ou não a sua escolha."})
            .addFields([
                { name: '🎌 País solicitado', value: message.cleanContent.trim(), inline: true },
            ]);

            existingChannel && existingRole && replyEmbed.addFields([{ name: '⚠️ Tudo certo, administrador!', value: `Aparentemente o país já tem um cargo e canal, que serão setados se escolher Permitir. Administrador, apenas verifique se o país escolhido já não tem dono(a).` }]);
            existingChannel && !existingRole && replyEmbed.addFields([{ name: '⚠️ País possui apenas canal', value: `O canal para o país **${country}** existe (<@&${existingRole.id}>) **mas ele não tem um cargo!** Se acredita que isso é um erro, prefira setar manualmente.` }]);
            !existingChannel && existingRole && replyEmbed.addFields([{ name: '⚠️ País possui apenas cargo', value: `O cargo para o país **${country}** existe (<@&${existingRole.id}>) **mas ele não tem um canal, ou a categoria de países não está configurada corretamente!** Se acredita que isso é um erro, prefira setar manualmente.` }]);
            !existingChannel && !existingRole && replyEmbed.addFields([{ name: '⚠️ Nota para o administrador', value: `Nenhum canal ou cargo para o país **${country}** foi encontrado. Um novo canal e cargo serão criados se você escolher Permitir. Se você acredita que isso é um erro, por favor, prefira setar manualmente, e adicione o cargo existente a(o) jogador(a).` }]);

            message.reply({
                //content: `-# pings vão aqui`,
                content: `-# <@&${message.guild.roles.cache.filter(r => !r.managed && !r.name.toLowerCase().includes('bot') && r.permissions.has(PermissionsBitField.Flags.ManageRoles)).map(r => r.id).join('> <@&')}>`,
                embeds: [replyEmbed],
                components: [
                    new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId('country_pick_deny')
                        .setLabel(`Não permitir`)
                        .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId('country_pick_manual')
                        .setLabel(`Vou setar manualmente`)
                        .setStyle(ButtonStyle.Secondary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                        .setCustomId('country_pick_allow')
                        .setLabel(`Permitir`)
                        .setStyle(ButtonStyle.Success)
                    )
                ]
            });
        }
    }
};
