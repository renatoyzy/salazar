import { ChannelType, Role } from "discord.js";

export default {
    name: 'roleDelete',

    /**
     * @param {Role} role 
     */
    async execute(role) {

        const equivalentChannel = role.guild.channels.cache.find(c => simplifyString(c.name).includes(simplifyString(role.name)));
        if(equivalentChannel) {
            equivalentChannel.deletable && equivalentChannel.delete('O cargo associado foi apagado.');
        }

        const serverConfig = await config(role.guildId);
        const pickCountryChannel = await role.guild.channels.fetch(serverConfig?.server?.channels?.picked_countries);

        if(!pickCountryChannel || pickCountryChannel.type != ChannelType.GuildText) return;

        const equivalentMessage = (await pickCountryChannel.messages.fetch({limit: 100})).find(m => simplifyString(m.content).includes(simplifyString(role.name)));
        if(equivalentMessage) {
            equivalentMessage.deletable && equivalentMessage.delete();
        }

    }
}