import {
    ActionRowBuilder,
    ButtonInteraction,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js"
import { config } from "../src/Server.js"

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        const serverConfig = await config(interaction.guildId);

        if(!interaction.member?.roles?.cache.has(serverConfig?.server?.roles?.player)) return interaction.reply({
            content: `Essa interação só está disponível para jogadores do roleplay.`,
            flags: [MessageFlags.Ephemeral]
        })

        await interaction.showModal(
            new ModalBuilder()
            .setCustomId(`war_action`)
            .setTitle('Sua ação de guerra')
            .addComponents(
                new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                    .setCustomId(`action_input`)
                    .setLabel('Escreva o conteúdo da ação. Seja breve.')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Iremos contornar a Linha Maginot pela Bélgica...')
                    .setMaxLength(4000)
                    .setMinLength(100)
                    .setRequired(true)
                )
            )
        )

    }

}