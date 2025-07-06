import { 
    ChatInputCommandInteraction, 
    SlashCommandBuilder 
} from "discord.js";
import bot_config from "../../config.json" with { type: "json" };

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription(`[Administrativo] Inicie o processo de instalação do ${bot_config.name} no seu servidor.`),

    setup_step: 0,
    ephemeral: true,

    /**
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(interaction) {

    }
}