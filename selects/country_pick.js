import {
    ActionRowBuilder,
    ModalBuilder,
    StringSelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle
} from "discord.js";
import * as Server from "../src/StringUtils.js";
import { countryPickDialog } from "../src/Roleplay.js";

export default {

    /**
     * @param {StringSelectMenuInteraction} interaction
     */
    async execute(interaction) {

        const selected = interaction.values[0];

        if (selected === "outro") {
            
            await interaction.showModal(
                new ModalBuilder()
                .setCustomId('country_pick_custom')
                .setTitle('Escolha outro país')
                .addComponents(
                    new ActionRowBuilder()
                    .addComponents(
                        new TextInputBuilder()
                        .setCustomId('country_input')
                        .setLabel('Digite o nome do país')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('Exemplo: Quinta República Francesa...')
                        .setRequired(true)
                    )
                )
            );

        } else {
            const selectedChannel = await interaction.guild.channels.fetch(selected);

            await countryPickDialog(selectedChannel.name, interaction);

        }

    }

}