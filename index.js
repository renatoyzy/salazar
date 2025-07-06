const Discord = require("discord.js");
const { REST, Routes } = require('discord.js');
const Canvas = require('canvas');
const { createCanvas, loadImage } = require('canvas');
const fs = require("node:fs");
const path = require("node:path");
const config = require("./config.json");
const package = require("./package.json");
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
require('dotenv/config');

// Eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for(const file of eventFiles) {

    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    };

};

// Crash handle
process.on('uncaughtException', (erro, origem) => {
    console.error(`Exceção não capturada.\n\nErro: ${erro}\n\nOrigem: ${origem}`)
    return client.guilds.cache.get(config.server.id).channels.cache.get(config.server.channels.logs).send({
        content: `<@${config.bot.owners.join('> <@')}>`,
        embeds: [
            new Discord.EmbedBuilder()
            .setColor(Discord.Colors.Red)
            .setTitle(`Exceção não capturada`)
            .setDescription(`${erro}`)
            .addFields([{
                name: `Origem`,
                value: `${origem}`
            }])
            .setFooter({text: `${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}:${new Date().getSeconds().toString().padStart(2,'0')}.${new Date().getMilliseconds().toString()} ${new Date().getDate().toString().padStart(2,'0')}/${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getFullYear().toString()}`})
        ]
    })
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`Rejeição não manuseada: ${reason} ${promise}`);
    return client.guilds.cache.get(config.server.id).channels.cache.get(config.server.channels.logs).send({
        content: `<@${config.bot.owners.join('> <@')}>`,
        embeds: [
            new Discord.EmbedBuilder()
            .setColor(Discord.Colors.Red)
            .setTitle(`Rejeição não manuseada`)
            .setDescription(`${erro}`)
            .setFooter({text: `${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}:${new Date().getSeconds().toString().padStart(2,'0')}.${new Date().getMilliseconds().toString()} ${new Date().getDate().toString().padStart(2,'0')}/${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getFullYear().toString()}`})
        ]
    })
})
client.login(process.env.DISCORD_TOKEN);