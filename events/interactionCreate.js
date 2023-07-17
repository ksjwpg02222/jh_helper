const { Events } = require('discord.js');
const logger = require('../logger.js');
require('dotenv').config()


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {

        if(process.env.MODE !== 'dev'){
            if (!interaction.member._roles.some(role => role === '937291899792928798')) {
                await interaction.reply({ content: '尚無JH身分組，如果有的話請詢問管理員。', ephemeral: true });
                return
            }
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            logger.info(`${interaction.member.displayName} used ${interaction.commandName} command.`)
            await command.execute(interaction);
        } catch (error) {
            logger.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }


    },
};