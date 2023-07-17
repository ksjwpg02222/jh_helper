const oc = require('./fun/oc.js')
const logger = require('../logger.js')

module.exports = (msg) => {
    const attachments = Array.from(msg.attachments.values())

    if (msg.channelId == '1010966927130251264' && attachments.length) {
        logger.info(`${msg.member.displayName} used oc command.`)
        oc(msg, attachments)
    }

}

