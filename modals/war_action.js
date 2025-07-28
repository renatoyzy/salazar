import {
    EmbedBuilder,
    MessageFlags,
    ModalSubmitInteraction
} from "discord.js";

export default {

    /**
     * @param {ModalSubmitInteraction} interaction 
     */
    async execute(interaction) {

        const side = interaction.customId.split(':')[1];
        const action = interaction.fields.getTextInputValue('action_input');

        const field = interaction.message.embeds[0]?.fields.find(field => side.includes('A') ? field.name.includes('A') : field.name.includes('B'));
        const oldEmbed = interaction.message.embeds[0];
        const newFields = oldEmbed.fields.map(f => f == field ? {name: field.name, value: action} : f);
        const newEmbed = new EmbedBuilder(oldEmbed).setFields(newFields);
        
        interaction.message.editable && interaction.message.edit({embeds: [newEmbed]});
        interaction.reply({ content: 'ok', flags: [MessageFlags.Ephemeral] })

    }

}