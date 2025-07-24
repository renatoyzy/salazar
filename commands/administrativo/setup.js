import {
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    Colors,
    RoleSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonBuilder,
    ButtonStyle
} from "discord.js";
import { MongoClient, ServerApiVersion } from "mongodb";
import bot_config from "../../config.json" with { type: "json" };
import { setup } from "../../src/server_info.js";
import deploy_commands from "../../src/deploy_commands.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription(`[Administrativo] Inicie o processo de instalação do ${bot_config.name} no seu servidor.`),

    setup_step: 0,
    disable_defer: true,

    /**
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {

        // Comece pedindo o nome do servidor via modal
        await interaction.showModal(
            new ModalBuilder()
            .setCustomId('setup_server_name')
            .setTitle('Configuração - Nome do servidor')
            .addComponents(
                new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                    .setCustomId('server_name_input')
                    .setLabel('Digite o nome do servidor')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Exemplo: Império do Norte - {ano}')
                    .setRequired(true)
                )
            )
        );

        const server_setup = await setup(interaction.guildId);

        const mongo_client = new MongoClient(process.env.DB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        let setup_data = server_setup || {
            server_id: interaction.guildId,
            server_tier: 0,
            server: {}
        };

        if(!setup_data.server) setup_data.server = {};
        setup_data.server.channels = {};
        setup_data.server.roles = {};

        const modalSubmit = await interaction.awaitModalSubmit({
            time: 5 * 60 * 1000,
            filter: (m) => m.user.id === interaction.user.id
        }).catch(() => null);

        if (!modalSubmit) {
            return interaction.followUp({
                content: "⏱ O setup foi cancelado por inatividade."
            });
        }

        const serverName = modalSubmit.fields.getTextInputValue('server_name_input');
        setup_data.server.name = serverName;

        await modalSubmit.reply({
            content: `Nome do servidor salvo como: **${serverName}**!\nSe você usar \`{ano}\` no nome, o ${bot_config.name} atualizará automaticamente o nome do servidor toda vez que o ano passar!`,
        });

        // Agora segue para o primeiro seletor: cargo dos jogadores
        await modalSubmit.followUp({
            content: `Agora informe o **cargo dos jogadores**.`,
            components: [
                new ActionRowBuilder().addComponents(
                    new RoleSelectMenuBuilder()
                        .setCustomId("setup_player_role")
                        .setPlaceholder("Escolha o cargo dos jogadores")
                        .setMinValues(1)
                        .setMaxValues(1)
                )
            ]
        });

        const collector = modalSubmit.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 10 * 60 * 1000
        });

        collector.on("collect", async (i) => {

            switch (i.customId) {
                case "setup_player_role":
                    setup_data.server.roles = {};
                    setup_data.server.roles.player = i.values[0];

                    await i.update({
                        content: `Agora informe o **cargo dos que não são jogadores**.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new RoleSelectMenuBuilder()
                                    .setCustomId("setup_non_player_role")
                                    .setPlaceholder("Escolha o cargo dos espectadores")
                                    .setMinValues(1)
                                    .setMaxValues(1)
                            )
                        ]
                    });
                    break;

                case "setup_non_player_role":
                    setup_data.server.roles.non_player = i.values[0];

                    await i.update({
                        content: `Agora selecione o **canal principal da administração**.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                    .setCustomId("setup_admin_channel")
                                    .setPlaceholder("Escolha o canal da administração")
                                    .setMinValues(1)
                                    .setMaxValues(1)
                            )
                        ]
                    });
                    break;

                case 'setup_admin_channel':
                    setup_data.server.channels.staff = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de registros**, onde você poderá ver todos os registros detalhados do bot.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_logs_channel")
                                .setPlaceholder("Escolha o canal de logs")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;

                case 'setup_logs_channel':
                    setup_data.server.channels.logs = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de linha do tempo do roleplay (memória e contexto do bot)**. Esse canal será basicamente a enciclopédia do servidor, que o bot vai consultar INTEIRA antes de toda resposta que ele der.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_context_channel")
                                .setPlaceholder("Escolha o canal de contexto")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;

                case 'setup_context_channel':
                    setup_data.server.channels.context = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de narrações**. Toda ação que um jogador fizer, que se encaixe no mínimo de 500 caracteres, o ${bot_config.name} vai narrar e publicar lá as narrações`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_narrations_channel")
                                .setPlaceholder("Escolha o canal de narrações")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;
                
                case "setup_narrations_channel":
                    setup_data.server.channels.narrations = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de passagem de tempo**. O chat em que você anuncia toda vez que o ano, semestre, ou período acaba. (O ${bot_config.name} não vai passar o ano contra sua vontade! Isso é só pra ele atualizar o tempo)`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_time_channel")
                                .setPlaceholder("Escolha o canal de passagem de tempo")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;
                
                case "setup_time_channel":
                    setup_data.server.channels.time = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de ações secretas**. Toda vez que um jogador fizer uma ação nesse chat, ela será apagada e reenviada num canal específico (que somente a administração deve poder ver, para poder narrar), mantendo segredo dos outros jogadores.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_secret_actions_channel")
                                .setPlaceholder("Escolha o canal de ações secretas")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;

                case "setup_secret_actions_channel":
                    setup_data.server.channels.secret_actions = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de registro de ações secretas**. Esse é o canal administrativo em que o bot vai reenviar as ações secretas, para serem narradas discretamente.`,
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_secret_actions_log_channel")
                                .setPlaceholder("Escolha o registro de ações secretas")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("setup_skip_secret_actions_log_channel")
                                .setLabel("Pular (não quero ações secretas)")
                                .setStyle(ButtonStyle.Secondary)
                            )
                        ]
                    });
                    break;

                case "setup_secret_actions_log_channel":
                    setup_data.server.channels.secret_actions_log = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione os **canais de eventos**. Esses canais são canais como de notícias, guerras, etc. Qualquer mensagem (que tenha um mínimo de 300 caracteres) enviada nesses canais será considerada um evento real, e o bot irá registrar no resumo do RP (sua memória) e considerar para narrações.\n-# Selecione de 1-15 canais. Pode incluir categorias também. Nesse caso, todos os canais dentro da categoria serão considerados.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_events_channels")
                                .setPlaceholder("Todos os canais de eventos")
                                .setMinValues(1)
                                .setMaxValues(15)
                            )
                        ]
                    });
                    break;
                
                case "setup_skip_secret_actions_log_channel":
                    setup_data.server.channels.secret_actions_log = null;
                    setup_data.server.channels.secret_actions_log_channel = null;
                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione os **canais de eventos**. Esses canais são canais como de notícias, guerras, etc. Qualquer mensagem (que tenha um mínimo de 300 caracteres) enviada nesses canais será considerada um evento real, e o bot irá registrar no resumo do RP (sua memória) e considerar para narrações.\n-# Selecione de 1-15 canais. Pode incluir categorias também. Nesse caso, todos os canais dentro da categoria serão considerados.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_events_channels")
                                .setPlaceholder("Todos os canais de eventos")
                                .setMinValues(1)
                                .setMaxValues(15)
                            )
                        ]
                    });
                    break;

                case "setup_events_channels":
                    setup_data.server.channels.events = i.values;

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione a **categoria dos canais de países**. Essa categoria é a que contém os canais específicos de país onde os jogadores podem gerenciar seus países, e o bot irá monitorar as mensagens para registrar ações e eventos relacionados aos países.\n-# Selecione a categoria que contenha os canais de países.`,
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_countries_category")
                                .setPlaceholder("Categoria dos canais de países")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("setup_skip_countries_category")
                                .setLabel("Pular (meu servidor não tem chats privados de países)")
                                .setStyle(ButtonStyle.Secondary)
                            )
                        ]
                    });
                    break;
                
                case "setup_skip_countries_category":
                    setup_data.server.channels.countries_category = null;
                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de escolha de país**. Esse é o canal onde os jogadores escolhem seus países no início do jogo. O bot irá monitorar esse canal para registrar as escolhas dos jogadores.`,
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_country_picking_channel")
                                .setPlaceholder("Canal de escolha de país")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("setup_skip_country_picking_channel")
                                .setLabel("Pular (não quero automatizar a escolha de país)")
                                .setStyle(ButtonStyle.Secondary)
                            )
                        ]
                    });
                    break;

                case "setup_countries_category":
                    setup_data.server.channels.countries_category = i.values[0];
                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de escolha de país**. Esse é o canal onde os jogadores escolhem seus países no início do jogo. O bot irá monitorar esse canal para registrar as escolhas dos jogadores.`,
                        components: [
                            new ActionRowBuilder()
                            .addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_country_picking_channel")
                                .setPlaceholder("Canal de escolha de país")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                            .addComponents(
                                new ButtonBuilder()
                                .setCustomId("setup_skip_country_picking_channel")
                                .setLabel("Pular (não quero automatizar a escolha de país)")
                                .setStyle(ButtonStyle.Secondary)
                            )
                        ]
                    });
                    break;
                
                case "setup_skip_country_picking_channel":
                    setup_data.server.channels.country_picking = null;

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione os **canais de ações**. Estes são os canais em que os jogadores jogam, basicamente. Qualquer mensagem de mais de 500 caracteres enviada por um jogador em um destes chats será considerada uma ação, e seus resultados serão narrados. \n-# Selecione de 1-15 canais. Pode incluir categorias também. Nesse caso, todos os canais dentro da categoria serão considerados.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_actions_channels")
                                .setPlaceholder("Todos os canais de ações")
                                .setMinValues(1)
                                .setMaxValues(15)
                            )
                        ]
                    });
                    break;

                case "setup_country_picking_channel":
                    setup_data.server.channels.country_picking = i.values[0];

                    i.guild.channels.cache.get(i.values[0]).send({
                        embeds: [
                            new EmbedBuilder()
                            .setDescription("Escolha com o que você vai jogar")
                            .setColor(Colors.Blurple)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .addComponents([
                                new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('Clique em mim para selecionar seu país!')
                                .setCustomId('country_pick')
                            ])
                        ]
                    });

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione o **canal de países escolhidos**. Basicamente, o Salazar vai registrar nesse canal quais países foram escolhidos pelos jogadores.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_picked_countries_channel")
                                .setPlaceholder("Canal de países escolhidos")
                                .setMinValues(1)
                                .setMaxValues(1)
                            )
                        ]
                    });
                    break;
                
                case "setup_picked_countries_channel":
                    setup_data.server.channels.picked_countries = i.values[0];

                    await i.message?.edit({
                        content: `Setup em andamento...`,
                        components: []
                    });
                    await i.update({
                        content: `Agora selecione os **canais de ações**. Estes são os canais em que os jogadores jogam, basicamente. Qualquer mensagem de mais de 500 caracteres enviada por um jogador em um destes chats será considerada uma ação, e seus resultados serão narrados. \n-# Selecione de 1-15 canais. Pode incluir categorias também. Nesse caso, todos os canais dentro da categoria serão considerados.`,
                        components: [
                            new ActionRowBuilder().addComponents(
                                new ChannelSelectMenuBuilder()
                                .setCustomId("setup_actions_channels")
                                .setPlaceholder("Todos os canais de ações")
                                .setMinValues(1)
                                .setMaxValues(15)
                            )
                        ]
                    });
                    break;

                case "setup_actions_channels":
                    setup_data.server.channels.actions = i.values;

                    await i.update({
                        content: `Finalizando setup...`,
                        components: []
                    });

                    delete setup_data.server_setup_step;

                    try {
                        await mongo_client.connect();

                        await mongo_client.db("Salazar").collection("configuration").updateOne(
                            { server_id: interaction.guildId },
                            { $set: setup_data },
                            { upsert: true }
                        );

                        await mongo_client.db('Salazar').collection('setup').deleteOne({ server_id: interaction.guildId });

                        await i.followUp({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("Setup concluído!")
                                    .setColor(Colors.Green)
                                    .setDescription(`O **${bot_config.name}** foi configurado com sucesso neste servidor`)
                                    .addFields([
                                        {
                                            name: 'Configurações adicionais!',
                                            value: 'Você pode configurar o bot ainda mais usando o comando `/configuração`. Opções como **prompt adicional** e **tempo para envio de todas as partes da ação** estão disponíveis apenas lá, fora todas as opções do setup.',
                                            inline: true
                                        }
                                    ])
                                    .setTimestamp(new Date())
                            ]
                        });

                    } catch (err) {
                        console.error(err);
                        await i.followUp({
                            content: `❌ Ocorreu um erro ao salvar a configuração.`
                        });
                    } finally {
                        await mongo_client.close();
                    }

                    collector.stop("completed");
                    deploy_commands(collector.guildId);
                    break;

                default:
                    break;
            }
        });

        collector.on("end", (collected, reason) => {
            if (reason !== "completed") {
                interaction.followUp({
                    content: "⏱ O setup foi cancelado por inatividade."
                }).catch(() => {});
            }
        });
    }
}
