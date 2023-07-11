const { SlashCommandBuilder, StringSelectMenuBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { default: axios } = require("axios");
const pushData = require("../../convertAndAdd.js")
const { CreateRegearEventIdFunc } = require('../../sql/table/regearEventIds.js');

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

        await interaction.deferReply({ ephemeral: true });

        const inGameName = interaction.options.getString('name');

        const { data: playerInfo } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/search?q=${inGameName}`)
        const player = playerInfo.players.find(data => data.Name === inGameName && data.GuildName === 'Just Hold')

        if (!player) {
            await interaction.editReply({ content: '不是JH的還敢用！', ephemeral: true });
            return
        }

        const { data: deaths } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/players/${player.Id}/deaths`)

        const data = deaths.filter(death => new Date().getTime() - new Date(death.TimeStamp).getTime() < 172800000)

        const info = data?.map((item, index) => ({
            name: `${index + 1}. [${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`,
            value: `https://albiononline.com/killboard/kill/${item.EventId}?server=live_sgp`
        }))

        const exampleEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(inGameName || '無資料')
            .setAuthor({ name: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' })
            .setDescription('最近 "兩天內" 的死亡紀錄(新至舊，最多10筆)')
            .setThumbnail('https://i.imgur.com/5IO5kPT.png')
            .addFields(info)
            .setTimestamp()
            .setFooter({ text: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' });

        const selectItem = data?.map((item, index) => (
            new StringSelectMenuOptionBuilder()
                .setLabel(`${index + 1}. 擊殺者 [${item.Killer.GuildName}]${item.Killer.Name}`)
                .setDescription(`[${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`)
                .setValue(`${item.EventId}`)
        ))

        const select = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('請選擇欲申請補裝死亡紀錄')
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


            const regearInfo =
                data.filter(d => selection.find(select => +d.EventId === +select))
                    .map((item, index) => ({
                        name: `${index + 1}. [${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`,
                        value: `https://albiononline.com/killboard/kill/${item.EventId}?server=live_sgp`
                    }))

            const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(inGameName || '無資料')
                .setAuthor({ name: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' })
                .setDescription('已送出補裝資料')
                .setThumbnail('https://i.imgur.com/5IO5kPT.png')
                .addFields(regearInfo)
                .setTimestamp()
                .setFooter({ text: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' });

            await interaction.deleteReply()
            await i.reply({ embeds: [exampleEmbed], ephemeral: true });

            for (let i = 0; i < selection.length; i++) {
                try {
                    await CreateRegearEventIdFunc(selection[i])

                    await pushData(selection[i])
                }
                catch (error) {
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        await i.followUp({ content: `https://albiononline.com/killboard/kill/${selection[i]}?server=live_sgp 補裝紀錄已存在`, ephemeral: true })
                    } else {
                        await i.followUp({ content: `發生未知錯誤、請找管理員。`, ephemeral: true })
                    }
                }
            }

        });
    },
};

