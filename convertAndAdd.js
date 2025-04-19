const AsyncLock = require('async-lock');
const fetch = require("node-fetch");
const config = require("./config/index")

let lock = new AsyncLock({ domainReentrant: true });

const APIbase = [
    "https://gameinfo-sgp.albiononline.com/api/gameinfo/events/",
    "https://gameinfo.albiononline.com/api/gameinfo/events/",
];

const getDict = async () => {
    let res = await fetch(config.DISC_URL);
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

const weaponNameParser = (data, dict, regerTier) => {
    if (!data) return "無";
    let id = data["Type"];
    let T = id.split("_")[0];
    let name, number;

    name = id.split("@")[0];
    number = id.split("@")[1];
    if (number == undefined) {
        number = "";
    }
    id = name.replace(`${T}_`, "");

    const tierSum = +T.replace('T', "") + +number

    if (regerTier == 8) {
        if (tierSum > 8) {
            return `T6.2${dict[id]}`;
        } else {
            return `${T}${number.length ? "." + number : ""}${dict[id]}`;

        }
    } else if (regerTier == 9) {
        if (tierSum > 9) {
            return `T6.2${dict[id]}`;
        } else {
            return `${T}${number.length ? "." + number : ""}${dict[id]}`;
        }
    } else {
        return `${T}${number.length ? "." + number : ""}${dict[id]}`;
    }
}

const bodyNameParser = (data, dict) => {
    if (!data) return "無";
    let id = data["Type"];
    let T = id.split("_")[0];
    let name, number;

    name = id.split("@")[0];
    number = id.split("@")[1];
    if (number == undefined) {
        number = "";
    }
    id = name.replace(`${T}_`, "");

    const tierSum = +T.replace('T', "") + +number

    if (tierSum > 8) {
        return `T6.2${dict[id]}`;
    } else {
        return `${T}${number.length ? "." + number : ""}${dict[id]}`;
    }
}

module.exports = async (eventId, remarkJsonObj, isFighter, regerTier) => {

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
        weapon: weaponNameParser(equipment["MainHand"], dict, regerTier),
        offHand: weaponNameParser(equipment["OffHand"], dict, regerTier),
        head: bodyNameParser(equipment["Head"], dict),
        armor: bodyNameParser(equipment["Armor"], dict),
        shoes: bodyNameParser(equipment["Shoes"], dict),
        cape: bodyNameParser(equipment["Cape"], dict),
        mount: bodyNameParser(equipment["Mount"], dict),
        time: `${date}.${month}.${year} ${hour}:${minute}`,
        eventId,
        isFighter: isFighter ? '是' : '否',
        remark: remarkJsonObj[eventId] || '無'
    }

    await lock.acquire('key', async () => {
        await fetch(config.ADD_URL, {
            "method": "POST",
            "Content-Type": "application/json",
            "body": JSON.stringify(result)
        });
    });
}
