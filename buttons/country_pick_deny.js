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
            content: `Você rejeitou a entrada dessa pessoa como esse país.`,
            flags: [MessageFlags.Ephemeral]
        });

        let newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setDescription("A escolha foi negada. Peça outro país, se quiser.")
        .setColor(Colors.Red)
        .setFields()
        .setFooter({
            text: `O(a) administrador(a) responsável foi ${interaction.member.displayName}.`
        });

        interaction.message.editable && interaction.message.edit({
            content: ``,
            embeds: [newEmbed],
            components: []
        });

        setTimeout(() => {
            interaction.message?.deletable && interaction.message.delete();
        }, 60_000);

        const player = (interaction.message.embeds[0].fields.find(f => f.name === '👥 ID do jogador')?.value);
        interaction.channel.send(`<@${player.id}>`).then(msg => msg.delete()).catch(() => {});
    }

}