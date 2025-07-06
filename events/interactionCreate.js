const Discord = require("discord.js");
const fs = require("node:fs");
const client = new Discord.Client({
    intents: [
        Discord.IntentsBitField.Flags.GuildExpressions,
        Discord.IntentsBitField.Flags.GuildIntegrations,
        Discord.IntentsBitField.Flags.GuildInvites,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildMessagePolls,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
        Discord.IntentsBitField.Flags.GuildMessageTyping,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildModeration,
        Discord.IntentsBitField.Flags.GuildPresences,
        Discord.IntentsBitField.Flags.GuildScheduledEvents,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
        Discord.IntentsBitField.Flags.GuildWebhooks,
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.MessageContent,
        Discord.IntentsBitField.Flags.DirectMessages,
        Discord.IntentsBitField.Flags.AutoModerationConfiguration,
        Discord.IntentsBitField.Flags.AutoModerationExecution,
    ],
    partials: [
        Discord.Partials.Message,
        Discord.Partials.GuildMember,
        Discord.Partials.Reaction,
        Discord.Partials.Channel,
        Discord.Partials.ThreadMember,
        Discord.Partials.User,
        Discord.Partials.GuildScheduledEvent,
    ],
});
const config = require("../config.json");
client.commands = getCommands("./commands");

module.exports = {

    name: 'interactionCreate',

    async execute(interaction) {

        // Comando
        if(interaction.isChatInputCommand()) {

            // Registrar
            if(interaction.guild.channels.cache.get(config.server.channels.logs)) {

                interactioncontent = interaction.options._hoistedOptions.length > 0 ? interaction.options._hoistedOptions.map((x) => `**${x.name.charAt(0).toUpperCase()}${x.name.slice(1)}:** `+"```"+`${x.value}`+"```") : "";
                
                // Se o comando não tiver conteúdo
                if(!interactioncontent) {

                    let subcom = "";
                    if(interaction.options.getSubcommand(false) != null) {
                        subcom = ` ${interaction.options.getSubcommand()}`
                    };
                    
                    interaction.guild.channels.cache.get(config.server.channels.logs).send({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setTitle(`🤖  Registro de comando`)
                            .setFields([
                                {
                                    name: `👤  Usuário`,
                                    value: `<@${interaction.user.id}> (${interaction.user.id})`
                                }, {
                                    name: `🤖  Comando`,
                                    value: `${interaction.commandName}${subcom}`
                                }, {
                                    name: `💬  Canal`,
                                    value: `<#${interaction.channelId}> (${interaction.channel.id})`
                                }
                            ])
                            .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                            .setColor(Discord.Colors.Blurple)
                            .setFooter({text: `${interaction.createdAt.getHours().toString().padStart(2, '0')}:${interaction.createdAt.getMinutes().toString().padStart(2, '0')}:${interaction.createdAt.getSeconds().toString().padStart(2, '0')}.${interaction.createdAt.getMilliseconds()} ${interaction.createdAt.getDate().toString().padStart(2, '0')}/${(interaction.createdAt.getMonth()+1).toString().padStart(2, '0')}/${interaction.createdAt.getFullYear()}`})
                        ]
                    });

                } else {

                    let subcom = "";
                    if(interaction.options.getSubcommand(false) != null) {
                        subcom = ` ${interaction.options.getSubcommand()}`
                    };

                    interaction.guild.channels.cache.get(config.server.channels.logs).send({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setTitle(`🤖  Registro de comando`)
                            .setFields([
                                {
                                    name: `👤  Usuário`,
                                    value: `<@${interaction.user.id}> (${interaction.user.id})`
                                }, {
                                    name: `🤖  Comando`,
                                    value: `${interaction.commandName}${subcom}`
                                }, {
                                    name: `🔖  Conteúdo`, 
                                    value: `${interactioncontent.join(`\n`)}`
                                }, {
                                    name: `💬  Canal`,
                                    value: `<#${interaction.channelId}> (${interaction.channel.id})`
                                }
                            ])
                            .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                            .setColor(Discord.Colors.Blurple)
                            .setFooter({text: `${interaction.createdAt.getHours().toString().padStart(2, '0')}:${interaction.createdAt.getMinutes().toString().padStart(2, '0')}:${interaction.createdAt.getSeconds().toString().padStart(2, '0')}.${interaction.createdAt.getMilliseconds()} ${interaction.createdAt.getDate().toString().padStart(2, '0')}/${(interaction.createdAt.getMonth()+1).toString().padStart(2, '0')}/${interaction.createdAt.getFullYear()}`})
                        ]
                    });

                };

            };

            // Comando
            let command = client.commands.get(interaction.commandName);

            // Executar
            try {
                if(interaction.replied) return;
                command.execute(interaction).catch(() => {});
            } catch (error) {
                console.error(error);
            };

        } 
        /*// Autocomplete
        else if(interaction.isAutocomplete()) {

            // Alterar economia
            if(interaction.commandName === "alterar") {
                if(interaction.options.getSubcommand() === "economia") {

                    const focusedValue = interaction.options.getFocused();
                    const filteredChoices = interaction.guild.channels.cache.get(config.roleplay.fichas_forum.id).threads.cache.filter(t => t.appliedTags.includes(config.roleplay.fichas_forum.tag_pais) && t.name.toLowerCase().includes(focusedValue.toLowerCase()))

                    const results = filteredChoices.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(pais => {
                        return {
                            name: `${pais.name}`,
                            value: `${pais.id}`
                        }
                    });

                    interaction.respond(results.slice(0, 25)).catch(() => {});

                };
            }
            // Visualizar ou transferir
            else if( ["visualizar", "transferir"].includes(interaction.commandName) ) {

                const focusedValue = interaction.options.getFocused();
                const filteredChoices = interaction.guild.channels.cache.get(config.roleplay.fichas_forum.id).threads.cache.filter(t => t.appliedTags.includes(config.roleplay.fichas_forum.tag_pais) && t.name.toLowerCase().includes(focusedValue.toLowerCase()))

                const results = filteredChoices.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(pais => {
                    return {
                        name: `${pais.name}`,
                        value: `${pais.id}`
                    }
                });

                interaction.respond(results.slice(0, 25)).catch(() => {});

            }
            // Gerar ficha econômica inicial
            else if(interaction.commandName === "gerar") {
                if(interaction.options.getSubcommand() === "ficha-econômica") {

                    const focusedValue = interaction.options.getFocused();
                    const filteredChoices = interaction.guild.channels.cache.get(config.roleplay.fichas_forum.id).threads.cache.filter(t => t.appliedTags.includes(config.roleplay.fichas_forum.tag_pais) && t.name.toLowerCase().includes(focusedValue.toLowerCase()))

                    const results = filteredChoices.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(pais => {
                        return {
                            name: `${pais.name}`,
                            value: `${pais.id}`
                        }
                    });

                    interaction.respond(results.slice(0, 25)).catch(() => {});

                };
            }
            // Carta ou espionar
            else if( ["carta", "espionar"].includes(interaction.commandName) ) {

                const focusedValue = interaction.options.getFocused();
                const filteredChoices = interaction.guild.channels.cache.get(config.roleplay.paises_categoria).children.cache.filter(t => t.name.toLowerCase().replaceAll("-", "").includes(focusedValue.toLowerCase()));

                const results = filteredChoices.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)).map(pais => {
                    return {
                        name: `${pais.name.replaceAll("-", " ").toUpperCase()}`,
                        value: `${pais.id}`
                    }
                });

                interaction.respond(results.slice(0, 25)).catch(() => {});

            };

        }*/
        // Botões
        else if(interaction.isButton()) {

            // Registrar
            if(interaction.guild.channels.cache.get(config.server.channels.logs)) {
                interaction.guild.channels.cache.get(config.server.channels.logs).send({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setTitle(`🤖  Registro de uso de botão`)
                        .setFields([
                            {
                                name: `👤  Usuário`,
                                value: `<@${interaction.user.id}> (${interaction.user.id})`
                            }, {
                                name: `🤖  Informações`,
                                value: `${interaction.customId}`
                            }, {
                                name: `💬  Canal`,
                                value: `${interaction.message.url} (${interaction.channel.id})`
                            }
                        ])
                        .setThumbnail(interaction.user.avatarURL({ dynamic: true }))
                        .setColor(Discord.Colors.Yellow)
                        .setFooter({text: `${interaction.createdAt.getHours().toString().padStart(2, '0')}:${interaction.createdAt.getMinutes().toString().padStart(2, '0')}:${interaction.createdAt.getSeconds().toString().padStart(2, '0')}.${interaction.createdAt.getMilliseconds()} ${interaction.createdAt.getDate().toString().padStart(2, '0')}/${(interaction.createdAt.getMonth()+1).toString().padStart(2, '0')}/${interaction.createdAt.getFullYear()}`})
                    ]
                });
            };

            // Handler
            client.buttons = new Discord.Collection();
            const buttons = fs.readdirSync("./buttons").filter(file => file.endsWith(".js"));
            for(file of buttons) {
                const buttonName = file.split(".")[0];
                const button = require(`../buttons/${buttonName}`);
                client.buttons.set(buttonName, button);
            };

            const button = client.buttons.get(interaction.customId);
            if(!button) return interaction.reply({content: `Botão desconhecido.`, flags: [Discord.MessageFlags.Ephemeral]});
            button.execute(interaction);

        };

    }

};

// Funções
function getCommands(dir) {

    let commands = new Discord.Collection();
    const commandFiles = getFiles(dir);

    for(const commandFile of commandFiles) {

        const command = require("."+commandFile);
        commands.set(command.data.toJSON().name, command);

    };

    return commands;

};
function getFiles(dir) {

    const files = fs.readdirSync(dir, {
        withFileTypes: true,
    });

    let commandFiles = [];

    for(const file of files) {

        if(file.isDirectory()) {
            commandFiles = [
                ...commandFiles,
                ...getFiles(`${dir}/${file.name}`),
            ];
        } else if(file.name.endsWith(".js")) {
            commandFiles.push(`${dir}/${file.name}`);
        };

    };

    return commandFiles;

};