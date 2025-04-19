const oc = require('./fun/oc.js')
const logger = require('../logger.js')
const config = require('../config/index.js')

module.exports = (msg) => {
    const attachments = Array.from(msg.attachments.values())

    logger.info(msg.author.id)


    if (attachments.length) {
        if (msg.channelId == config.MSG_CHANNEL_ID) {
            oc(msg, attachments)
        }
    }
}

