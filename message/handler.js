const oc = require('./fun/oc.js')
const logger = require('../logger.js')
require('dotenv').config()

module.exports = (msg) => {
    const attachments = Array.from(msg.attachments.values())

    logger.info(msg.author.id)


    if (attachments.length) {
        if ((process.env.MODE === 'dev' && msg.channelId == '1010966927130251264') || msg.channelId == '1292335759717564466') {
            oc(msg, attachments)
        }
    }
}

