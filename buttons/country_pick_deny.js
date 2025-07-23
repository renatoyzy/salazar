import { 
    EmbedBuilder, 
    Colors, 
    ButtonInteraction
} from 'discord.js';
import { config } from '../src/server_info.js';

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        // Responde ao usuário que a escolha foi negada
        const interactionMessageReference = await interaction.message.fetchReference();
        interaction.reply({
            content: `<@${interactionMessageReference?.author.id}>`,
            embeds: [
                new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription("Sua escolha de país foi negada por um administrador.")
            ]
        });

        interaction.message.editable && interaction.message.edit({
            content: '',
            embeds: interaction.message.embeds,
            components: []
        })
    }

}