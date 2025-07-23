import { 
    Colors, 
    ButtonInteraction,
    MessageFlags,
    EmbedBuilder,
    PermissionsBitField
} from 'discord.js';

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        if(!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({
            content: `Você não tem o cargo necessário para isso.`,
            flags: [MessageFlags.Ephemeral]
        });

        interaction.reply({
            content: `Sinto muito. Você vai precisar adicionar o cargo do país (que já existe, segundo você) ao jogador manualmente.`,
            flags: [MessageFlags.Ephemeral]
        });

        let newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription("A escolha foi aprovada e um administrador deve setar suas permissões manualmente em breve.")
        .setColor(Colors.Green)
        .setFields()
        .setFooter({
            text: `O(a) administrador(a) responsável foi ${interaction.member.displayName}.`
        });

        interaction.message.editable && interaction.message.edit({
            content: ``,
            embeds: [newEmbed],
            components: []
        });

        interaction.channel.send(`<@${(await interaction.message.fetchReference())?.author.id}>`).then(msg => msg.delete()).catch(() => {});
    }

}