const { Sequelize } = require('sequelize');
const sequelize = require("../connect.js")
const spreadSheetsId = '1m56QTu-G-Pf63wkSNmAcFdLiWdW9eF7kzf-H-Q2d2So'
const sheetId = '10126847'
const credentials = '../../credentials.json'
const { GoogleSpreadsheet } = require('google-spreadsheet')

const Items = sequelize.define('item', {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    type: {
        type: Sequelize.STRING
    },
    category: {
        type: Sequelize.STRING
    },
    parts: {
        type: Sequelize.STRING
    }
});

const itemCount = async () => await Items.count();

const findByType = async (type) => await Items.findAll({ where: { type: type } })

const groupByArgs = async (args) => await Items.findAll({ group: args, attributes: [args] })

const queryByPartsThenGroupByCategory = async (args) => await Items.findAll({ raw: true, group: 'category', where: { parts: args.parts }, attributes: ['category'] })

const queryByCategoryAndParts = async (args) => await Items.findAll({ where: { parts: args.parts, category: args.category }, attributes: ['name'] })

const initData = async () => {
    const data = await getData()
    const jsonArray = data.map(d => ({ name: d[1], category: d[2], type: d[3], parts: d[4] }))
    await Items.bulkCreate(jsonArray)
}

async function getData() {
    const doc = new GoogleSpreadsheet(spreadSheetsId);
    const creds = require(credentials);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo();
    const sheet = doc.sheetsById[sheetId];
    const rows = await sheet.getRows();
    let result = [];
    for (row of rows) {
        result.push(row._rawData);
    }
    return result;
};

module.exports = { Item: Items, itemCount,  initData, findByType, groupByArgs, queryByPartsThenGroupByCategory, queryByCategoryAndParts }