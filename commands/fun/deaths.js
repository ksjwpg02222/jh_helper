const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { default: axios } = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deaths')
        .setNameLocalizations({
            "zh-TW": '死亡',
            "zh-CN": '死亡',
        })
        .setDescription('Query Deaths History.')
        .setDescriptionLocalizations({
            "zh-TW": '查詢近十筆死亡紀錄',
            "zh-CN": '查询近十笔死亡纪录',
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
        // const player = playerInfo.players.find(data => data.Name === inGameName && data.GuildName === '補裝機器人')
        const player = playerInfo.players.find(data => data.Name === inGameName)

        // if (!player) {
        //     await interaction.editReply({ content: '輸入的查詢名稱並未是JH之成員。', ephemeral: true });
        //     return
        // }

        const { data } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/players/${player.Id}/deaths`)

        const info = data?.map((item) => ({
            name: `[${item.Killer.GuildName}]${item.Killer.Name} 殺了 [${item.Victim.GuildName}]${item.Victim.Name}`,
            value: `https://albiononline.com/killboard/kill/${item.EventId}?server=live_sgp`
        }))

        if (info.length) {
            const exampleEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(inGameName || '無資料')
                .setAuthor({ name: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' })
                .setDescription('近期10筆死亡紀錄')
                .setThumbnail('https://i.imgur.com/5IO5kPT.png')
                .addFields(info)
                .setTimestamp()
                .setFooter({ text: 'Just Hold', iconURL: 'https://i.imgur.com/5IO5kPT.png' });


            await interaction.editReply({ embeds: [exampleEmbed], ephemeral: true });
        } else {
            await interaction.editReply({ content: `查無 ${inGameName} 的資料，請看看有無打錯遊戲名稱(大小寫一致)。`, ephemeral: true });
        }

    },
};

