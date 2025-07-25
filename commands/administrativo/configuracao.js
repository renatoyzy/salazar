import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandIntegerOption,
    SlashCommandRoleOption,
    SlashCommandStringOption
} from "discord.js";
import {
    MongoClient,
    ServerApiVersion
} from "mongodb";
import { config } from "../../src/server_info.js";
import bot_config from "../../config.json" with { type: "json" };
import { inspect } from "util";

export default {
    data: new SlashCommandBuilder()
        .setName('configuração')
        .setDescription(`[Administrativo] Comando para visualizar ou alterar a configuração do ${bot_config.name} no seu servidor`)
        .addStringOption(
            new SlashCommandStringOption()
            .setName(`opção`)
            .setDescription(`Qual opção deve ser alterada`)
            .setRequired(false)
            .setChoices([
                { name: 'Nome do servidor', value: 'name' },
                { name: 'Prompt adicional', value: 'extra_prompt' },
                { name: 'Segundos para enviar partes da ação', value: 'action_timing' },
                { name: 'Cargo de jogador', value: 'roles.player' },
                { name: 'Cargo de não jogador', value: 'roles.non_player' },
                { name: 'Canal da administração', value: 'channels.staff' },
                { name: 'Canal de registros', value: 'channels.logs' },
                { name: 'Canal da memória do bot', value: 'channels.context' },
                { name: 'Canais de ações', value: 'channels.actions' },
                { name: 'Canais de eventos', value: 'channels.events' },
                { name: 'Canal de narrações', value: 'channels.narrations' },
                { name: 'Canal de passagem do tempo', value: 'channels.time' },
                { name: 'Canal de ações secretas', value: 'channels.secret_actions' },
                { name: 'Canal administrativo de ações secretas', value: 'channels.secret_actions_log' },
                { name: 'Canal de escolha de país', value: 'channels.country_picking' },
                { name: 'Canal de países escolhidos', value: 'channels.picked_countries' },
                { name: 'Categoria de chat dos países ', value: 'channels.country_category' },
            ])
        )
        .addChannelOption(
            new SlashCommandChannelOption()
            .setName('canal')
            .setDescription('O canal ou categoria que será definido para essa opção')
            .setRequired(false)
        )
        .addRoleOption(
            new SlashCommandRoleOption()
            .setName('cargo')
            .setDescription('O cargo que será definido para essa opção')
            .setRequired(false)
        )
        .addStringOption(
            new SlashCommandStringOption()
            .setName('texto')
            .setDescription('O texto que será definido para essa opção')
            .setRequired(false)
        )
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('tempo')
            .setDescription('O tempo em segundos que será definido para essa opção')
            .setRequired(false)
        ),

    min_tier: 1,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        const server_config = await config(interaction.guildId);
        const option = interaction.options.get('opção')?.value;

        const options_alike = {
            'channels': 'canal',
            'roles': 'cargo',

            'name': 'texto',
            'extra_prompt': 'texto',
            'action_timing': 'tempo'
        };
        // Verifica se a opção é um campo de array
        const array_options = [
            'channels.actions',
            'channels.events'
        ];

        const option_labels = {
            "name": "Nome do servidor",
            "extra_prompt": "Prompt adicional",
            "action_timing": "Segundos para enviar partes da ação",
            "roles.player": "Cargo de jogador",
            "roles.non_player": "Cargo de não jogador",
            "channels.staff": "Canal da administração",
            "channels.logs": "Canal de registros",
            "channels.context": "Canal da memória do bot",
            "channels.actions": "Canais de ações",
            "channels.events": "Canais de eventos",
            "channels.narrations": "Canal de narrações",
            "channels.time": "Canal de passagem do tempo",
            "channels.secret_actions": "Canal de ações secretas",
            "channels.secret_actions_log": "Canal administrativo de ações secretas",
            "channels.country_category": "Categoria de chat dos países",
            "channels.country_picking": "Canal de escolha de país",
            "channels.picked_countries": "Canal de países escolhidos"
        };

        const mongo_client = new MongoClient(process.env.DB_URI, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });        

        try {
            await mongo_client.connect();

            const collection = mongo_client.db('Salazar').collection('configuration');

            // Exibir configuração atual
            if(!option) {
                const reply_config = await collection.findOne(
                    { server_id: interaction.guildId }
                );

                let response_code = `\`\`\`json\n${inspect(JSON.parse(JSON.stringify(reply_config.server)), { depth: 2 })?.slice(0, 990)}\n\`\`\``.replace('channels', 'Canais').replace('roles', 'Cargos');

                Object.keys(option_labels).reverse().forEach(key => {
                    response_code = response_code.replace(`${key.includes('.') ? key.split('.')[1] : key}`, option_labels[key]);
                });

                return await interaction.editReply({embeds: [
                    new EmbedBuilder()
                    .setTitle(`Configuração atual do servidor`)
                    .setColor(Colors.Blurple)
                    .setDescription(response_code)
                    .setTimestamp(interaction.createdAt)
                ]})
            }

            const value = interaction.options.get(options_alike[option.split('.')[0]])?.value;

            if (!value) return interaction.editReply({embeds: [
                new EmbedBuilder()
                .setDescription(`Para alterar o **${option_labels[option] || option}**, você precisa definir o argumento de **${options_alike[option.split('.')[0]]}** no comando, e não o que você definiu.`)
                .setColor(Colors.Red)
            ]});

            let updateQuery;
            let action;
            let fake_value;

            if (option.split('.')[0] == "name") fake_value = value;
            else if (option.split('.')[0] == "channels") fake_value = "<#"+value+">";
            else if (option.split('.')[0] == "roles") fake_value = "<@&"+value+">";

            if (array_options.includes(option)) {
                // Verifica se o valor já existe no array
                const current = server_config?.server?.[option.split('.')[0]]?.[option.split('.')[1]] || [];

                if (current.includes(value)) {
                    // Valor já existe → remove
                    updateQuery = { $pull: { [`server.${option}`]: value } };
                    action = `${fake_value} removido de ${option_labels[option] || option}`;
                } else {
                    // Valor não existe → adiciona
                    updateQuery = { $push: { [`server.${option}`]: value } };
                    action = `${fake_value} adicionado de ${option_labels[option] || option}`;
                }

            } else {
                // Campo simples → apenas set, mas se o valor já for igual ao atual, deixa undefined
                const currentValue = server_config?.server?.[option.split('.')[0]]?.[option.split('.')[1]] ?? server_config?.server?.[option];
                if (currentValue === value) {
                    updateQuery = { $set: { [`server.${option}`]: undefined } };
                    action = `${option_labels[option] || option} já estava definido como ${fake_value}, valor removido (undefined)`;
                } else {
                    updateQuery = { $set: { [`server.${option}`]: value } };
                    action = `${option_labels[option] || option} redefinido para ${fake_value}`;
                }
            }

            // Additional tasks
            switch (option) {
                case "channels.country_picking":
                    interaction.guild.channels.cache.get(value) &&
                    interaction.guild.channels.cache.get(value).send({
                        embeds: [
                            new EmbedBuilder()
                            .setDescription("Escolha com o que você vai jogar!")
                            .setColor(Colors.Blurple)
                        ],
                        components: [
                            new ActionRowBuilder()
                            .addComponents([
                                new ButtonBuilder()
                                .setStyle(ButtonStyle.Primary)
                                .setLabel('Selecionar seu país!')
                                .setCustomId('country_pick'),
                                new ButtonBuilder()
                                .setStyle(ButtonStyle.Secondary)
                                .setLabel('Sair do roleplay')
                                .setCustomId('country_leave')
                            ])
                        ]
                    });
                    break;
            
                default:
                    break;
            }

            const reply_config = await collection.findOneAndUpdate(
                { server_id: interaction.guildId },
                updateQuery,
                { returnDocument: "after", upsert: true }
            );

            let response_code = `\`\`\`json\n${inspect(JSON.parse(JSON.stringify(reply_config.server)), { depth: 2 })?.slice(0, 990)}\n\`\`\``.replace('channels', 'Canais').replace('roles', 'Cargos');

            Object.keys(option_labels).reverse().forEach(key => {
                response_code = response_code.replace(`${key.includes('.') ? key.split('.')[1] : key}`, option_labels[key]);
            });

            let embed_fields = [{
                name: `Configuração atual do servidor`,
                value: response_code
            }];

            array_options.includes(option) && embed_fields.push({name: 'Dica para configurações que aceitam mais de um valor', value: 'Você sabia que quando um elemento (tipo o Canais de Eventos) aceita múltiplos valores, você pode adicionar **ou remover** um valor da lista bastando usar o mesmo comando?'})
            option == "name" && embed_fields.push({name: 'Dica pro nome do servidor', value: 'Se você colocar "{ano}" em alguma parte do nome, toda vez que o ano mudar, o nome do servidor será atualizado!'})

            await interaction.editReply({embeds: [
                new EmbedBuilder()
                .setTitle(`Configuração alterada com sucesso!`)
                .setColor(Colors.Green)
                .setDescription(action)
                .addFields(embed_fields)
                .setTimestamp(interaction.createdAt)
            ]})

        } catch (err) {
            console.error(err);
            await interaction.editReply(`Ocorreu um erro ao atualizar a configuração.`);
        } finally {
            await mongo_client.close();
        }
    }

}