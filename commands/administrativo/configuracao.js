import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder 
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('configuração')
        .setDescription('discord frescuras'),

    ephemeral: true,

    min_tier: 1,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        interaction.editReply('teste')
    }
}