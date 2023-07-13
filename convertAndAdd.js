const AsyncLock = require('async-lock');
const fetch = require("node-fetch");

let lock = new AsyncLock({ domainReentrant: true });

const appUrl = 'https://script.google.com/macros/s/AKfycbwX8oIlvPmz6f-fRRt94FRKyzFfBfyNbAKE6qoSYPOlvYNvKChkcHYSh6ye3A-4Qm0xNw/exec'

const APIbase = [
    "https://gameinfo-sgp.albiononline.com/api/gameinfo/events/",
    "https://gameinfo.albiononline.com/api/gameinfo/events/",
];

const getDict = async () => {
    let res = await fetch("https://script.google.com/macros/s/AKfycbxEwEUvD0X6ntSEQRAnR8XLD1FhplCgwN_x59AJIF5UsP9FWJUTUaXlbQZnZOFhShWacw/exec");
    return res.json();
}

const nameParser = (data, dict, isMount) => {
    if (!data) return "無";

    let withT_mount = [
        "MOUNT_HORSE",
        "MOUNT_ARMORED_HORSE",
        "MOUNT_OX",
        "MOUNT_COUGAR_KEEPER"
    ]

    let id = data["Type"];
    let T = id.split("_")[0];
    let name, number;

    name = id.split("@")[0];
    number = id.split("@")[1];
    if (number == undefined) {
        number = "";
    }
    id = name.replace(`${T}_`, "");

    if (!dict[id] && (!isMount || withT_mount.includes(id))) return data["Type"];
    else if (!dict[id] && !(withT_mount.includes(id))) return id;
    else if (isMount && !(withT_mount.includes(id))) return `${dict[id]}`;
    else return `${T}${number.length ? "." + number : ""}${dict[id]}`;
}

module.exports = async (eventId, isFighter) => {

    let res = [await fetch(APIbase[0] + eventId), await fetch(APIbase[1] + eventId)].filter(i => i.status === 200)[0];
    let data = await res.json();

    let date_obj = new Date(data["TimeStamp"]);

    let year = date_obj.getFullYear();
    let month = String(date_obj.getMonth() + 1).padStart(2, '0');
    let date = String(date_obj.getDate()).padStart(2, '0');

    let hour = String(date_obj.getHours()).padStart(2, '0');
    let minute = String(date_obj.getMinutes()).padStart(2, '0');

    let victim = data["Victim"];
    let equipment = victim["Equipment"];

    let dict = await getDict();

    let result = {
        name: victim["Name"],
        weapon: nameParser(equipment["MainHand"], dict),
        offHand: nameParser(equipment["OffHand"], dict),
        head: nameParser(equipment["Head"], dict),
        armor: nameParser(equipment["Armor"], dict),
        shoes: nameParser(equipment["Shoes"], dict),
        cape: nameParser(equipment["Cape"], dict),
        mount: nameParser(equipment["Mount"], dict, true),
        time: `${date}.${month}.${year} ${hour}:${minute}`,
        eventId,
        isFighter: isFighter ? '是' : '否'
    }

    await lock.acquire('key', async () => {
        await fetch(appUrl, {
            "method": "POST",
            "Content-Type": "application/json",
            "body": JSON.stringify(result)
        });
    });
}
