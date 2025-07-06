const Discord = require("discord.js");
const Canvas = require('canvas');
const fs = require("node:fs");
const path = require("node:path");
const { inspect } = require("node:util");
const config = require("../../config.json");
const package = require("../../package.json");
const genai = require('@google/genai');
require('dotenv/config');
const ai = new genai.GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

module.exports = {

    data: new Discord.SlashCommandBuilder()
    .setName("eval")
    .setDescription("[Desenvolvedor] Executa um código JavaScript diretamente do discord")
    .addStringOption(
        new Discord.SlashCommandStringOption()
        .setName("código")
        .setDescription("Código a ser executado")
        .setRequired(true)
    ),

    async execute(interaction) {
        
        if(!config.bot.owners.includes(interaction.user.id)) return interaction.reply({content: "Este comando não foi feito para que __você__ o use.", flags: [Discord.MessageFlags.Ephemeral]})
        
        async function _evalCode(code, interaction) {
            
            await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                    .setColor("DarkGrey")
                    .setDescription("Carregando.")
                ],
                flags: [Discord.MessageFlags.Ephemeral]
            }).catch(() => {});

            var replyColor;
            var replyTitle;

            try {
                output = await eval(code);
                replyColor = "Blurple";
                replyTitle = "Código executado!";
            } catch (error) {
                output = error.toString();
                replyColor = "Red";
                replyTitle = "Código não executado";
            }

            await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                    .setTitle(replyTitle)
                    .addFields([
                        {
                            name: "Entrada",
                            value: "```js\n"+code+"\n```"
                        }, {
                            name: "Saída",
                            value: "```js\n"+inspect(output, {depth: 0}).slice(0, 990)+"\n```"
                        }
                    ])
                    .setColor(replyColor)
                ],
            }).catch(() => {})

        };

        interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                .setColor("DarkGrey")
                .setDescription("Carregando...")
            ],
            flags: [Discord.MessageFlags.Ephemeral]
        }).then(async () => {
            
            _evalCode(interaction.options.get("código").value, interaction).catch((err) => {
                interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${err}`)
                    ],
                    flags: [Discord.MessageFlags.Ephemeral]
                }).catch(() => {})
            });

        }).catch(() => {});

    }

};

// Funções
function roundTwo(n) {
    return `${(+(Math.round(n + "e+2") + "e-2")).toLocaleString()}`
};

// Funções
function roundTwoOg(n) {
    return +(Math.round(n + "e+2") + "e-2")
};