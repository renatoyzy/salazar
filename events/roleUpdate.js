import { ChannelType, Role } from "discord.js";
import { simplifyString } from "../src/StringUtils.js";
import * as Server from "../src/Server.js";

export default {
    name: 'roleUpdate',

    /**
     * @param {Role} oldRole 
     * @param {Role} newRole 
     */
    async execute(oldRole, newRole) {

        if(oldRole.name == newRole.name) return;

        const serverConfig = await Server.config(newRole.guild.id);
        
        const equivalentChannel = newRole.guild.channels.cache.find(c => simplifyString(oldRole.name).includes(simplifyString(c.name)));

        if(
            equivalentChannel &&
            equivalentChannel.parentId != serverConfig?.server?.channels?.country_category &&
            equivalentChannel.parent?.parentId != serverConfig?.server?.channels?.country_category
        ) return;

        if(equivalentChannel) {
            equivalentChannel.setName(simplifyString(newRole.name, true, true)).catch(() => {});
        }

        const pickCountryChannel = newRole.guild.channels.cache.get(serverConfig?.server?.channels?.picked_countries);

        if(!pickCountryChannel || pickCountryChannel.type != ChannelType.GuildText) return;

        const equivalentMessage = (await pickCountryChannel.messages.fetch({limit: 100})).find(m => simplifyString(m.content).includes(simplifyString(oldRole.name)));
        if(equivalentMessage) {
            let newContent = equivalentMessage.content.split('\n');
            newContent.splice(0,1);
            newContent.unshift(`## ${simplifyString(newRole.name, true, true, false).toUpperCase()}`);
            equivalentMessage.editable && equivalentMessage.edit(newContent.join('\n'))
        }

    }
}