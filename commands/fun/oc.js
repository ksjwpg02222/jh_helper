const { SlashCommandBuilder, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const logger = require('../../logger');
const { findByType, groupByArgs , queryByTypeThenGroupByCategory} = require("../../sql/table/item.js")
const { Client, Collection, GatewayIntentBits } = require('discord.js');

module.exports = {
    async execute(interaction) {

        logger.info('hehe')
        // await interaction.deferReply({ ephemeral: true });

        // // const inGameName = interaction.options.getString('name');


        // const typeOptions = await groupByArgs('type')

        // logger.info(typeOptions)

        // const selectItem = typeOptions?.map((type) => (
        //     new StringSelectMenuOptionBuilder()
        //         .setLabel(`${type.type}`)
        //         .setValue(`${type.type}`)
        // ))

        // const select = new StringSelectMenuBuilder()
        //     .setCustomId('starter')
        //     .setPlaceholder('請選擇類別：')
        //     .addOptions(selectItem);

        // const row = new ActionRowBuilder()
        //     .addComponents(select);

        // const response = await interaction.editReply({
        //     content: '武器或防具:',
        //     components: [row],
        //     ephemeral: true
        // });

        // const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });

        // collector.on('collect', async i => {
        //     const typeOptions = await queryByTypeThenGroupByCategory(i.values)
        //     logger.info(typeOptions)
            
        // });

    }

};


