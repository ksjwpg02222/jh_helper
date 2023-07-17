const oc = require('./fun/oc.js')
const logger = require('../logger.js')

module.exports = (msg) => {
    const attachments = Array.from(msg.attachments.values())

    if (msg.channelId == '1130488156907638836' && attachments.length) {
        logger.info(`${msg.member.displayName} used oc command.`)
        oc(msg, attachments)
    }

}

