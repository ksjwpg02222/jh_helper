const { Events } = require('discord.js');
const { RegearEventIds } = require("../sql/table/regearEventIds.js")
const { Item, itemCount, initData } = require("../sql/table/items.js")
const logger = require('../logger.js');
const CronJob = require('cron').CronJob;
const config = require('../config/index.js')

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        RegearEventIds.sync()
        Item.sync().then(async () => {
            if (!await itemCount()) {
                logger.info('Init Item Start.')
                await initData()
                logger.info('Init Item Complete.')

            }
        })
        logger.info('Ready!');


        // const t8 = '1234712990557933619'
        // const t9 = '1234713051031404585'

        // const job = CronJob.from({
        //     cronTime: '0 0 20 * * *',
        //     onTick: async function () {
        //         logger.info('補裝身分組移除排程開始');
        //         const guild = client.guilds.cache.first()

        //         let targetList = guild.members.cache;
        //         targetList.forEach((target) => {
        //             target.roles.remove(t8)
        //             target.roles.remove(t9)
        //         });
        //         logger.info('補裝身分組移除排程結束');
        //     },
        //     start: true,
        //     timeZone: 'Asia/Hong_Kong'
        // });
    },
};