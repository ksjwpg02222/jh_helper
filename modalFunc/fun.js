const { EmbedBuilder } = require('discord.js');
const pushData = require("../convertAndAdd.js")
const { CreateRegearEventIdFunc } = require('../sql/table/regearEventIds.js');

module.exports = async (interaction) => {

    if (interaction.customId == 'regear') {

        await interaction.deferReply({ ephemeral: true });

        const isFighter = interaction.member._roles.some(role => role === '959422545088638987' || role === '1119473118650568734')
        const fields = interaction.fields.fields.map(field => field)

        const deathsInfo = Array.of(interaction.message.components)[0][0].components[0].options

        const remarkJsonObj = fields.reduce((prev, current) => {
            prev[current.customId] = current.value
            return { ...prev }
        }, {})

        const regearInfo =
            deathsInfo
                .filter(info => fields.find(field => +info.value === +field.customId))
                .map((item, index) => ({
                    name: `${index + 1}. ${item.description}`,
                    value: `備註:${remarkJsonObj[item.value] || '無'} \n https://albiononline.com/killboard/kill/${item.value}?server=live_sgp`
                }))

        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('補裝資訊')
            .setAuthor({ name: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' })
            .setDescription('已送出補裝資料')
            .setThumbnail('https://i.imgur.com/5IO5kPT.png')
            .addFields(regearInfo)
            .setTimestamp()
            .setFooter({ text: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' });

        await interaction.editReply({ embeds: [exampleEmbed], ephemeral: true });
        
        for (let index = 0; index < fields.length; index++) {
            try {
                await CreateRegearEventIdFunc(fields[index].customId)

                await pushData(fields[index].customId, remarkJsonObj, isFighter)
            }
            catch (error) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    await i.followUp({ content: `https://albiononline.com/killboard/kill/${fields[index].customId}?server=live_sgp 補裝紀錄已存在`, ephemeral: true })
                } else {
                    await i.followUp({ content: `發生未知錯誤、請找管理員。`, ephemeral: true })
                }
            }
        }
    }

}