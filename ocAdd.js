const AsyncLock = require('async-lock');
const fetch = require("node-fetch");

let lock = new AsyncLock({ domainReentrant: true });

const appUrl = 'https://script.google.com/macros/s/AKfycbw8AVM4-hdDgdzTGPCoRQ_L4hOjanZqCN2wDZLi1-kH7pflBXd9DbjCapgDzn8syZHlIg/exec'

module.exports = async (jsonObj) => {

    let date_obj = new Date();

    let year = date_obj.getFullYear();
    let month = String(date_obj.getMonth() + 1).padStart(2, '0');
    let date = String(date_obj.getDate()).padStart(2, '0');

    let hour = String(date_obj.getHours()).padStart(2, '0');
    let minute = String(date_obj.getMinutes()).padStart(2, '0');

    let result = {
        name: jsonObj.name || '',
        weapon: jsonObj.weapon || '',
        offHand: jsonObj.offHand || '',
        head: jsonObj.head || '',
        armor: jsonObj.armor || '',
        shoes: jsonObj.shoes || '',
        cape: jsonObj.cape || '',
        mount: jsonObj.mount || '',
        time: `${date}.${month}.${year} ${hour}:${minute}`,
        eventId: jsonObj.eventId,
        isFighter: jsonObj.isFighter ? '是' : '否',
        remark: jsonObj.remark || '無'
    }

    await lock.acquire('key', async () => {
        await fetch(appUrl, {
            "method": "POST",
            "Content-Type": "application/json",
            "body": JSON.stringify(result)
        });
    });
}
