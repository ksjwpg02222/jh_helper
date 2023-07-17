const { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const logger = require('../logger.js');
const messageHandler = require('../message/handler.js')
// const { findByType, groupByArgs, queryByTypeThenGroupByCategory } = require("../sql/table/item.js")

module.exports = {
    name: Events.MessageCreate,
    async execute(msg) {

        if (msg.author.bot) return

        messageHandler(msg)
    },
};