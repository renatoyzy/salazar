import { ChannelType, GuildChannel } from "discord.js";
import { simplifyString } from "../src/string_functions.js";
import { config } from "../src/server_info.js";

export default {
    name: 'channelDelete',

    /**
     * @param {GuildChannel} channel 
     */
    async execute(channel) {

        const serverConfig = await config(channel.guild.id);

        if(channel.parentId != serverConfig?.server?.channels?.country_category &&
            channel.parent?.parentId != serverConfig?.server?.channels?.country_category
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