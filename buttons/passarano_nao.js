const Discord = require("discord.js");

module.exports = {

    async execute(interaction) {

        if(!interaction.message.mentions.users.has(interaction.user.id)) return interaction.reply({flags: [Discord.MessageFlags.Ephemeral], content: `Essa interação não é sua. Não se intrometa.`});
        interaction.reply({flags: [Discord.MessageFlags.Ephemeral], content: `Entendido. O ano não será passado.`});
        if(interaction.message.deletable) interaction.message.delete();

    }

};