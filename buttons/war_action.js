import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from "discord.js"

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        await interaction.showModal(
            new ModalBuilder()
            .setCustomId(`war_action`)
            .setTitle('Sua ação de guerra')
            .addComponents(
                new ActionRowBuilder()
                .addComponents(
                    new TextInputBuilder()
                    .setCustomId(`action_input`)
                    .setLabel('Escreva o conteúdo da ação')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Iremos contornar a Linha Maginot pela Bélgica...')
                    .setMaxLength(1024)
                    .setMinLength(200)
                    .setRequired(true)
                )
            )
        )

    }

}