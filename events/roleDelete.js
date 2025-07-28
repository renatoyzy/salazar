import { ChannelType, Role } from "discord.js";
import { simplifyString } from "../src/StringUtils.js";
import * as Server from "../src/Server.js";

export default {
    name: 'roleDelete',

    /**
     * @param {Role} role 
     */
    async execute(role) {

        const serverConfig = await Server.config(role.guild.id);
        
        const equivalentChannel = role.guild.channels.cache.find(c => simplifyString(role.name).includes(simplifyString(c.name)));
        const countryCategoryId = serverConfig?.server?.channels?.country_category;
        
        if(
            equivalentChannel &&
            (!countryCategoryId ||
            (equivalentChannel.parentId != countryCategoryId &&
            equivalentChannel.parent?.parentId != countryCategoryId))
        ) return;

        if(equivalentChannel) {
            equivalentChannel.delete('O cargo associado foi apagado.').catch(() => {});
        }

        const pickCountryChannel = role.guild.channels.cache.get(serverConfig?.server?.channels?.picked_countries);

        if(!pickCountryChannel || pickCountryChannel.type != ChannelType.GuildText) return;

        const equivalentMessage = (await pickCountryChannel.messages.fetch({limit: 100})).find(m => simplifyString(m.content).includes(simplifyString(role.name)));
        if(equivalentMessage) {
            equivalentMessage.deletable && equivalentMessage.delete();
        }

    }
}