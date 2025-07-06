import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder 
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('configuração')
        .setDescription('discord frescuras'),

    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        interaction.editReply('teste')
    }
}