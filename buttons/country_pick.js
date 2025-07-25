import { 
    ActionRowBuilder,
    ButtonInteraction,
    ChannelType,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} from 'discord.js';
import { config } from '../src/server_info.js';

const cooldownUsers = {};

export default {

    /**
     * @param {ButtonInteraction} interaction 
     */
    async execute(interaction) {

        const USE_COOLDOWN = 10 * 60 * 1000;

        if(Object.keys(cooldownUsers).includes(interaction.user.id)) return interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: `Você só poderá usar esse botão novamente <t:${Math.floor(cooldownUsers[interaction.user.id]/1000)}:R>`
        });

        cooldownUsers[interaction.user.id] = new Date().getTime() + (USE_COOLDOWN);
        setTimeout(() => {
            delete cooldownUsers[interaction.user.id];    
        }, USE_COOLDOWN);

        const server_config = await config(interaction.guildId);

        if (!server_config?.server?.channels?.picked_countries) return;
        if(server_config?.server_tier<=2) return interaction.reply({content: 'Essa funcionalidade não está disponível no plano atual do servidor.', flags: [MessageFlags.Ephemeral]});

        const country_category = await interaction.guild?.channels.fetch(server_config?.server?.channels?.country_category);
        if(country_category.type != ChannelType.GuildCategory) return interaction.reply({content: 'A categoria de países não está configurada corretamente', flags: [MessageFlags.Ephemeral]});
        const country_channels = country_category.children.cache;

        let options = country_channels.map(c => 
            new StringSelectMenuOptionBuilder()
			.setLabel(`${c.name}`)
			.setValue(`${c.id}`)
        ).sort((a, b) => a.data.label.localeCompare(b.data.label));

        options.push(
            new StringSelectMenuOptionBuilder()
            .setLabel('outro')
            .setValue('outro')
            .setDescription('Não encontrei o país que desejo nas opções.')
        )

        const MAX_OPTIONS = 25;
        let selectMenus = [];

        // Divide as opções em grupos de até 25
        for (let i = 0; i < options.length; i += MAX_OPTIONS) {
            selectMenus.push(
                new StringSelectMenuBuilder()
                .setCustomId(`country_pick:${i/MAX_OPTIONS}`)
                .setPlaceholder(`Opções a partir de ${options[i].data.label} (alfabeticamente)`)
                .setMinValues(1)
                .setMaxValues(1)
                .setOptions(options.slice(i, i + MAX_OPTIONS))
            );
        }

        interaction.reply({
            flags: [MessageFlags.Ephemeral],
            content: '## Escolha com o que vai jogar:',
            components: selectMenus.map(menu => new ActionRowBuilder().addComponents(menu))
        })

    }

}