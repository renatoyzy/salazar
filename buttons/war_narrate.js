import { ButtonInteraction, MessageFlags, PermissionsBitField } from "discord.js";
import 'dotenv/config';
import { aiGenerate } from "../src/AIUtils.js";
import { addContext, getAllPlayers, getContext, getCurrentDate, getWars, warActionSendEmbed } from "../src/Roleplay.js";
import { chunkifyText } from "../src/StringUtils.js";
import botConfig from "../config.json" with { type: "json" };

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({
            content: `Você não tem o cargo necessário para isso.`,
            flags: [MessageFlags.Ephemeral]
        });
        
        interaction.reply({ content: 'A narração será enviada em breve. Marque os envolvidos quando isso acontecer.', flags: [MessageFlags.Ephemeral] });

        const actions = interaction.message.embeds[0]?.fields.map(field => `## ${field.name}\n${field.value}`);
        const pings = interaction.message.embeds[0]?.fields.map(field => `<@${field.name.split(' ')[0]}>`).join(' ');
        
        const actionContext = await getContext(interaction.guild);
        const warHistory = (await interaction.channel.messages.fetch({ limit: 100 })).sort((a, b) => a.createdTimestamp - b.createdTimestamp).map(msg => msg.cleanContent).join('\n\n');
        const serverOwnedCountries = await getAllPlayers(interaction.guild);
        const serverRoleplayDate = await getCurrentDate(interaction.guild);
        const serverCurrentWars = await getWars(interaction.guild);

        const prompt = eval("`" + process.env.PROMPT_WAR_NARRATION + "`");
        
        console.log(`- Turno de guerra ${interaction.channel.name} sendo narrado em ${interaction.guild.name} (${interaction.guildId})`);

        const response = await aiGenerate(prompt).catch(error => {
            console.error("Erro ao gerar narração:", error);
        });

        var json;
        try {
            var json = JSON.parse("{"+response.text?.split("{")[1]?.split("}")[0]+"}");
        } catch (error) {
            return console.error('Algo deu errado em narração de guerra: '+response.text);
        }

        if(!json || !json['narracao'] || !json['contexto'])
            return console.error('Algo deu errado em narração de guerra: '+response.text);
                
        try {
            interaction.channel.send(`# Novo turno da guerra:`);
            chunkifyText(json['narracao'])?.forEach(chunk => interaction.channel.send(chunk));
        } finally {
            interaction.channel.send(warActionSendEmbed);
            interaction.channel.send(`@here ${pings}`).then(msg => setTimeout(() => {
                msg?.deletable && msg?.delete();
            }, 5_000));
        };

        addContext(json['contexto'], interaction.guild);

        interaction.message?.deletable && interaction.message.delete();

    }

}