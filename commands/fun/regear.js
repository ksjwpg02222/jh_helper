const { SlashCommandBuilder, StringSelectMenuBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { default: axios } = require("axios");
const pushData = require("../../convertAndAdd.js")
const { CreateRegearEventIdFunc } = require('../../sql/table/regearEventIds.js');
const logger = require('../../logger.js');
const config = require('../../config/index.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regear')
        .setNameLocalizations({
            "zh-TW": '補裝',
            "zh-CN": '补装',
        })
        .setDescription('Regear Apply.')
        .setDescriptionLocalizations({
            "zh-TW": '補裝申請。',
            "zh-CN": '补装申请。',
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
        let removeId;

        let regerTier;

        await interaction.deferReply({ ephemeral: true });

        // const isFighter = interaction.member._roles.some(role => role === '1218506937872810035')
        const isFighter = false
        const inGameName = interaction.options.getString('name');

        if (interaction.member._roles.some(role => role === config.T8_TAG_ID)) {
            regerTier = 8
            removeId = config.T8_TAG_ID
        }

        if (interaction.member._roles.some(role => role === config.T9_TAG_ID)) {
            regerTier = 9
            removeId = config.T9_TAG_ID
        }

        // if (interaction.member._roles.some(role => role === config.FULL_TAG_ID)) {
        //     regerTier = 11
        //     removeId = config.FULL_TAG_ID
        // }

        if (!regerTier) {
            await interaction.editReply({ content: '無補裝身分組', ephemeral: true });
            return
        }

        logger.info(`${inGameName}申請補裝`);

        const { data: playerInfo } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/search?q=${inGameName}`)
        const player = playerInfo.players.find(data => data.Name === inGameName && data.GuildName === config.GUILD_NAME)
        // const player = playerInfo.players.find(data => data.Name === inGameName)

        if (!player) {
            await interaction.editReply({ content: '查無輸入的查詢名稱成員', ephemeral: true });
            return
        }

        const { data: deaths } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/players/${player.Id}/deaths`)

        const data = deaths.filter(death => new Date().getTime() - new Date(death.TimeStamp).getTime() < 432000000)

        const info = data?.map((item, index) => ({
            name: `${index + 1}. [${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`,
            value: `https://albiononline.com/killboard/kill/${item.EventId}?server=live_sgp`
        }))

        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(inGameName || '無資料 No Data')
            .setAuthor({ name: '補裝機器人' })
            .setDescription('最近 "五天內" 的死亡紀錄(新至舊，最多10筆)')
            .addFields(info)
            .setTimestamp()
            .setFooter({ text: '補裝機器人' });

        const selectItem = data?.map((item, index) => (
            new StringSelectMenuOptionBuilder()
                .setLabel(`${index + 1}. 擊殺者 [${item.Killer.GuildName}]${item.Killer.Name}`)
                .setDescription(`[${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`)
                .setValue(`${item.EventId}`)
        ))

        if (!selectItem.length) {
            await interaction.editReply({ content: '近五天內無任何死亡紀錄，若是近幾分鐘內有死亡的話請稍後再試。 \n No Data', ephemeral: true });
            return
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('請選擇欲申請補裝死亡紀錄 Pls Select Death Record')
            .setMinValues(1)
            .setMaxValues(selectItem.length)
            .addOptions(selectItem);

        const row = new ActionRowBuilder()
            .addComponents(select);

        const response = await interaction.editReply({
            embeds: [exampleEmbed],
            content: '死亡紀錄選擇:',
            components: [row],
            ephemeral: true
        });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });

        collector.on('collect', async i => {
            const selection = i.values

            const inputs =
                data.filter(d => selection.find(select => +d.EventId === +select))
                    .map((item, index) => {
                        let text = `${index + 1}.  被 [${item.Killer.GuildName}]${item.Killer.Name} 殺了`
                        if (text.length > 45) {
                            const guildName = item.Killer.GuildName.split(' ').reduce((prev, current) => {
                                prev += current.charAt(0).toUpperCase()
                                return prev
                            }, '')
                            text = `${index + 1}.  被 [${guildName}]${item.Killer.Name} 殺了`
                        }

                        return new TextInputBuilder()
                            .setCustomId(`${item.EventId}`)
                            .setLabel(text)
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('備註必填 (日期、時間、mass類型、caller)')
                            .setRequired(true)
                    })

            const modal = new ModalBuilder()
                .setCustomId('regear')
                .setTitle('補裝事項備註 Remark');

            const actionRows = inputs.map(input => new ActionRowBuilder().addComponents(input))

            modal.addComponents(actionRows);

            await i.showModal(modal);

            i.awaitModalSubmit({ filter: filterI => filterI.user.id === i.user.id, time: 120_000 })
                .then(async interaction => {

                    await interaction.deferReply({ ephemeral: true });

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
                        .setTitle('補裝資訊 Info')
                        .setAuthor({ name: '補裝機器人' })
                        .setDescription('已送出補裝資料 Complete')
                        .addFields(regearInfo)
                        .setTimestamp()
                        .setFooter({ text: '補裝機器人' });

                    await interaction.editReply({ embeds: [exampleEmbed], ephemeral: true });

                    const target = interaction.guild.members.cache.find(member => member.id === interaction.user.id)

                    target.roles.remove(removeId)

                    for (let index = 0; index < fields.length; index++) {
                        try {
                            await CreateRegearEventIdFunc(fields[index].customId)

                            await pushData(fields[index].customId, remarkJsonObj, isFighter, regerTier)
                        }
                        catch (error) {
                            if (error.name === 'SequelizeUniqueConstraintError') {
                                await interaction.followUp({ content: `https://albiononline.com/killboard/kill/${fields[index].customId}?server=live_sgp 補裝紀錄已存在`, ephemeral: true })
                            } else {
                                await interaction.followUp({ content: `發生未知錯誤、請找管理員 \nError.`, ephemeral: true })
                            }
                        }
                    }
                })

        });
    },
};

