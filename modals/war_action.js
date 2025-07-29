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

        const action = interaction.fields.getTextInputValue('action_input');

        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = new EmbedBuilder(oldEmbed);
        
        oldEmbed.fields.find(field => field.name.includes(interaction.member.id)) ?
            newEmbed.setFields(oldEmbed.fields.map(field => field.name.includes(interaction.member.id) ? { name: `Ação de ${interaction.member.displayName} (${interaction.member.id})`, value: action, inline: true } : field))
        :
            newEmbed.addFields({ name: `Ação de ${interaction.member.displayName} (${interaction.member.id})`, value: action, inline: true });
        
        interaction.message.editable && interaction.message.edit({ embeds: [newEmbed] });
        interaction.reply({ content: 'Sua ação de guerra foi registrada. Volte quando ocorrer a narração.', flags: [MessageFlags.Ephemeral] })

    }

}