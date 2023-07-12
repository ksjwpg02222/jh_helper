const { Events } = require('discord.js');
const { RegearEventIds } = require("../sql/table/regearEventIds.js")
const { Item, itemCount, initData } = require("../sql/table/item.js")
const logger = require('../logger.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute() {
        RegearEventIds.sync()
        Item.sync().then(async () => {
            if (!await itemCount()) {
                logger.info('Init Item Start.')
                await initData()
                logger.info('Init Item Complete.')

            }
        })
        logger.info('Ready!');
    },
};