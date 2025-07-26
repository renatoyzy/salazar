import { ChannelType, GuildChannel } from "discord.js";
import { simplifyString } from "../src/StringUtils.js";
import * as Server from "../src/Server.js";

export default {
    name: 'channelUpdate',

    /**
     * @param {GuildChannel} oldChannel 
     * @param {GuildChannel} newChannel 
     */
    async execute(oldChannel, newChannel) {

        if(oldChannel.name == newChannel.name) return;

        const serverConfig = await Server.config(newChannel.guild.id);

        if(newChannel.parentId != serverConfig?.server?.channels?.country_category &&
            newChannel.parent?.parentId != serverConfig?.server?.channels?.country_category
        ) return;

        const equivalentRole = newChannel.guild.roles.cache.find(r => simplifyString(r.name).includes(simplifyString(oldChannel.name)));
        if(equivalentRole) {

            await equivalentRole.setName(simplifyString(newChannel.name, true, true).toUpperCase()).catch(() => {});

        } else if(!newChannel.guild.roles.cache.find(r => simplifyString(r.name).includes(simplifyString(newChannel.name)))) {

            const pickCountryChannel = newChannel.guild.channels.cache.get(serverConfig?.server?.channels?.picked_countries);

            if(!pickCountryChannel || pickCountryChannel.type != ChannelType.GuildText) return;

            const equivalentMessage = (await pickCountryChannel.messages.fetch({limit: 100})).find(m => simplifyString(m.content).includes(simplifyString(oldChannel.name)));
            if(equivalentMessage) {
                let newContent = equivalentMessage.content.split('\n');
                newContent.splice(0,1);
                newContent.unshift(`## ${simplifyString(newChannel.name, true, true, false).toUpperCase()}`);
                equivalentMessage.editable && equivalentMessage.edit(newContent.join('\n'))
            }

        }
        
    }
}