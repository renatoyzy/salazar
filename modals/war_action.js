import {
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction
} from "discord.js";
import { chunkifyText } from "../src/StringUtils.js";

export default {

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {

        const action = chunkifyText(interaction.fields.getTextInputValue('action_input'), 1024);

        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = new EmbedBuilder(oldEmbed);

        newEmbed.setFields(oldEmbed.fields.filter(field => !field.name.includes(interaction.member.id)));
        
        for (let i = 0; i < action.length; i++) {
            const actionPart = action[i];
            action.length > 1 ?
                newEmbed.addFields({ name: `${interaction.member.id} - Parte ${i+1} da ação de ${interaction.member.displayName}`, value: actionPart, inline: true })
            :
                newEmbed.addFields({ name: `${interaction.member.id} - Ação de ${interaction.member.displayName}`, value: actionPart, inline: true })
        }
        
        newEmbed.setFields(newEmbed.data.fields.sort((a, b) => a.name.localeCompare(b.name)));

        interaction.message.editable && interaction.message.edit({ embeds: [newEmbed] });
        interaction.reply({ content: 'Sua ação de guerra foi registrada. Volte quando ocorrer a narração.', flags: [MessageFlags.Ephemeral] })

    }

}