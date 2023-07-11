const { Sequelize } = require('sequelize');
const sequelize = require("../connect.js")

const RegearEventIds = sequelize.define('regearEventIds', {
    eventId: {
        type: Sequelize.STRING,
        unique: true,
    }
});

const CreateRegearEventIdFunc = async (eventId) => await RegearEventIds.create({
    eventId: eventId
});

const FindAllFromRegearEventIdsFunc = async () => await RegearEventIds.findAll({ attributes: ['eventId'] });

module.exports = { RegearEventIds, CreateRegearEventIdFunc, FindAllFromRegearEventIdsFunc }