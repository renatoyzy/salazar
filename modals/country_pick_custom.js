import {
    ModalSubmitInteraction,
} from "discord.js";
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