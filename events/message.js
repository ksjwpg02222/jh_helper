const { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logger.js');
// const { findByType, groupByArgs, queryByTypeThenGroupByCategory } = require("../sql/table/item.js")

module.exports = {
    name: Events.MessageCreate,
    async execute(msg) {

        if (msg.author.bot) return

        const attachments = Array.from(msg.attachments.values())

        if (msg.channelId == '1010966927130251264' && attachments.length) {

            let button = new ActionRowBuilder();
            button.addComponents(
                new ButtonBuilder()
                    .setCustomId('oc')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('點我以上方圖片申請補裝。'),
            );
            msg.reply({ components: [button], ephemeral: true });

        }
    },
};