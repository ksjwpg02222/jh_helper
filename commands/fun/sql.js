const { SlashCommandBuilder } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet')
const credentials = '../../credentials.json'
const boxSpreadSheetsId = '1-E6eQcZe-xf0IYXusb5Cb0MJ4BCYViAqy5oRN31VMiM'
const boxSheetId = '1687369622'
const spreadSheetsId = '1f05Sf6W4Jcgm2vDKk9TdOB-OMV9CDLrjhawwLhE0vOw'
const sheetId = '1948413126'
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('query1')
        .setNameLocalizations({
            "zh-TW": '查詢1',
            "zh-CN": '查询1',
        })
        .setDescription('Query Your Guild Profile.')
        .setDescriptionLocalizations({
            "zh-TW": '查詢於工會的繳費、CTA次數、退稅、補裝箱位置等等..',
            "zh-CN": '查询于工会的缴费、CTA次数、退税、补装箱位置等等..',
        })
        .addStringOption(option =>
            option.setName('name')
                .setNameLocalizations({
                    "zh-TW": '名稱',
                    "zh-CN": '名称'
                })
                .setDescription("In Game Name")
                .setDescriptionLocalizations({
                    "zh-TW": '遊戲內名稱',
                    "zh-CN": '游戏内名称'
                })
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const inGameName = interaction.options.getString('name');
        const box = await getData(boxSpreadSheetsId, boxSheetId)
        const boxTarget = box.find(r => r[0] === inGameName)

        const result = await getData(spreadSheetsId, sheetId)
        const target = result.find(r => r[0] === inGameName)

        if (boxTarget) {
            const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(boxTarget[0] || '無資料')
                .setURL('https://docs.google.com/spreadsheets/d/1-E6eQcZe-xf0IYXusb5Cb0MJ4BCYViAqy5oRN31VMiM/edit#gid=733040667')
                .setAuthor({ name: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' })
                .setDescription('工會內CTA次數、繳稅、退稅、補裝資料')
                .setThumbnail('https://i.imgur.com/5IO5kPT.png')
                .addFields(
                    { name: '本周應繳金額', value: target[5] || '無資料', inline: true },
                    { name: '是否已繳納', value: target[6] || '無資料', inline: true },
                    { name: '\u200B', value: '\u200B' }
                )
                .addFields(
                    { name: 'CTA出席次數', value: boxTarget[1] || '無資料', inline: true },
                    { name: '可退稅金額', value: boxTarget[4] || '無資料', inline: true },
                    { name: '補裝箱編號', value: boxTarget[5] || '無資料', inline: true }
                )
                .setTimestamp()
                .setImage('https://i.imgur.com/3o59qVr.png')
                .setFooter({ text: '有問題請私訊幹部.   Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' });


            await interaction.editReply({ embeds: [exampleEmbed], ephemeral: true });
        } else {
            await interaction.editReply({ content: `查無 ${inGameName} 的資料，請看看有無打錯遊戲名稱或直接詢問幹部。`, ephemeral: true });
        }

        async function getData(spreadSheetsId, sheetId) {
            const doc = new GoogleSpreadsheet(spreadSheetsId);
            const creds = require(credentials);
            await doc.useServiceAccountAuth(creds);
            await doc.loadInfo();
            const sheet = doc.sheetsById[sheetId];
            const rows = await sheet.getRows();
            const result = [];
            for (row of rows) {
                result.push(row._rawData);
            }
            return result;
        };
    },
};

