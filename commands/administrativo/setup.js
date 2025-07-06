import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder 
} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('discord frescuras'),

    setup_step: 0,
    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {
        interaction.editReply('teste')
    }
}