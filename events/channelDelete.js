import { ChannelType, GuildChannel } from "discord.js";
import { simplifyString } from "../src/StringUtils.js";
import * as Server from "../src/Server.js";

export default {
    name: 'channelDelete',

    /**
     * @param {GuildChannel} channel 
     */
    async execute(channel) {

        const serverConfig = await Server.config(channel.guild.id);
        const countryCategoryId = serverConfig?.server?.channels?.country_category;

        if(
            !countryCategoryId ||
            (channel.parentId != countryCategoryId &&
            channel.parent?.parentId != countryCategoryId)
        ) return;

        const equivalentRole = channel.guild.roles.cache.find(r => simplifyString(r.name).includes(simplifyString(channel.name)));
        if(equivalentRole) {
            await equivalentRole.delete('O canal associado foi apagado.').catch(() => {});
        }

        const pickCountryChannel = channel.guild.channels.cache.get(serverConfig?.server?.channels?.picked_countries);

        if(!pickCountryChannel || pickCountryChannel.type != ChannelType.GuildText) return;

        const equivalentMessage = (await pickCountryChannel.messages.fetch({limit: 100})).find(m => simplifyString(m.content).includes(simplifyString(channel.name)));
        if(equivalentMessage) {
            equivalentMessage.deletable && equivalentMessage.delete();
        }
        
    }
}