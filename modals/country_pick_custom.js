import {
    ButtonBuilder,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction,
    PermissionsBitField,
    ActionRowBuilder
} from "discord.js";
import { simplifyString } from "../src/StringUtils.js";
import * as Server from "../src/Server.js";
import { countryPickDialog } from "../src/Roleplay.js";

export default {

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {

        const selected = interaction.fields.getTextInputValue('country_input');
        
        await countryPickDialog(selected, interaction)

    }

}