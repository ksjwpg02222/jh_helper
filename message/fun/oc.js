const { TextInputStyle, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { queryByPartsThenGroupByCategory, queryByCategoryAndParts } = require("../../sql/table/items.js")
const ocAdd = require("../../ocAdd.js");
const logger = require('../../logger.js');

const dataObj = {}
module.exports = async (msg, attachments) => {

    dataObj[msg.author.id] = { attachments: attachments[0].url }
    const button = new ActionRowBuilder();
    button.addComponents(
        new ButtonBuilder()
            .setCustomId('oc')
            .setStyle(ButtonStyle.Primary)
            .setLabel('點我以上方圖片申請補裝。'),
    );
    const response = await msg.reply({ components: [button], ephemeral: true });

    response.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 })
        .then(async interaction => {

            await interaction.deferReply({ ephemeral: true });

            const isFighter = interaction.member._roles.some(role => role === '1218506937872810035')

            dataObj[msg.author.id] = { ...dataObj[msg.author.id], isFighter }

            const data = ['頭', '身', '腳', '武器', '副手']
            const selectItem = data?.map((item) => (
                new StringSelectMenuOptionBuilder()
                    .setLabel(item)
                    .setValue(item))
            )

            const select = new StringSelectMenuBuilder()
                .setCustomId('broken')
                .setPlaceholder('請選擇爆裝部位')
                .setMinValues(1)
                .setMaxValues(selectItem.length)
                .addOptions(selectItem);

            const row = new ActionRowBuilder()
                .addComponents(select);


            const button = new ActionRowBuilder();
            button.addComponents(
                new ButtonBuilder()
                    .setCustomId('button')
                    .setStyle(ButtonStyle.Success)
                    .setLabel('下一步'),
            );

            const response = await interaction.editReply({
                content: '請選擇爆裝部位 \n 如果含副手五件全爆的話請分兩次\n 下一個步驟沒辦法容納那麼多選擇框\n',
                ephemeral: true,
                components: [row, button]

            });

            const collector = await response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });


            collector.on('collect', i => {
                i.deferUpdate();
                dataObj[msg.author.id] = { ...dataObj[msg.author.id], selected: i.values }
            });


            response.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 })
                .then(async tInteraction => {
                    await tInteraction.deferReply({ ephemeral: true });

                    const t = ['平7', '平8', '平9', '平10', '平11']

                    const tComponent = dataObj[tInteraction.user.id].selected.map((select, index) => {
                        const items = t.map((t) => {
                            const json = { parts: select, t: t }
                            return new StringSelectMenuOptionBuilder()
                                .setLabel(`${select}-${t}`)
                                .setValue(JSON.stringify(json))
                        })

                        return new StringSelectMenuBuilder()
                            .setCustomId(`t${index}`)
                            .setPlaceholder(`請選擇 "${select}" 的T數`)
                            .addOptions(items)
                    })

                    const tRows = tComponent.map(c => new ActionRowBuilder().addComponents(c))

                    const tButton = new ActionRowBuilder();
                    tButton.addComponents(
                        new ButtonBuilder()
                            .setCustomId('tButton')
                            .setStyle(ButtonStyle.Success)
                            .setLabel('下一步'),
                    );

                    const tResponse = await tInteraction.editReply({
                        content: '請選擇T數:',
                        components: [...tRows, tButton],
                        ephemeral: true
                    })

                    const collector = await tResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });

                    collector.on('collect', i => {
                        i.deferUpdate();
                        const tSelected = dataObj[i.user.id].tSelected || []
                        tSelected.push(i.values[0])

                        dataObj[i.user.id] = {
                            ...dataObj[i.user.id],
                            tSelected
                        }

                    });


                    tResponse.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 })
                        .then(async categoryInteraction => {
                            await categoryInteraction.deferReply({ ephemeral: true });

                            const categoryComponent =
                                await Promise.all(
                                    dataObj[categoryInteraction.user.id].tSelected?.map(async (select, index) => {

                                        const jsonObj = JSON.parse(select)

                                        const category = await queryByPartsThenGroupByCategory(jsonObj)

                                        const items = category.map((c) => {
                                            const json = { ...jsonObj, category: c.category }
                                            return new StringSelectMenuOptionBuilder()
                                                .setLabel(`${jsonObj.parts}-${c.category}`)
                                                .setValue(JSON.stringify(json))
                                        })

                                        return new StringSelectMenuBuilder()
                                            .setCustomId(`category${index}`)
                                            .setPlaceholder(`請選擇 "${jsonObj.parts}" 的類別`)
                                            .addOptions(items)
                                    })
                                )

                            const categoryRows = categoryComponent.map(c => new ActionRowBuilder().addComponents(c))

                            const categoryButton = new ActionRowBuilder();
                            categoryButton.addComponents(
                                new ButtonBuilder()
                                    .setCustomId('categoryButton')
                                    .setStyle(ButtonStyle.Success)
                                    .setLabel('下一步'),
                            );

                            const categoryResponse = await categoryInteraction.editReply({
                                content: '請選擇類別:',
                                components: [...categoryRows, categoryButton],
                                ephemeral: true
                            })


                            const categoryCollector = await categoryResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });

                            categoryCollector.on('collect', i => {
                                i.deferUpdate();
                                const categorySelected = dataObj[i.user.id].categorySelected || []
                                categorySelected.push(i.values[0])
        
                                dataObj[i.user.id] = {
                                    ...dataObj[i.user.id],
                                    categorySelected
                                }

                            });

                            

                            categoryResponse.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 })
                                .then(async itemInteraction => {

                                    console.log(dataObj)

                                    await itemInteraction.deferReply({ ephemeral: true });

                                    const itemComponent =
                                        await Promise.all(
                                            dataObj[itemInteraction.user.id].categorySelected.map(async (select, index) => {

                                                const jsonObj = JSON.parse(select)

                                                const items = await queryByCategoryAndParts(jsonObj)

                                                const options = items.map((item) => {
                                                    const json = { ...jsonObj, name: item.name }
                                                    return new StringSelectMenuOptionBuilder()
                                                        .setLabel(`${jsonObj.t}-${item.name}`)
                                                        .setValue(JSON.stringify(json))
                                                })

                                                return new StringSelectMenuBuilder()
                                                    .setCustomId(`item${index}`)
                                                    .setPlaceholder(`請選擇${jsonObj.parts}裝備`)
                                                    .addOptions(options)
                                            })
                                        )

                                    const itemRows = itemComponent.map(c => new ActionRowBuilder().addComponents(c))

                                    const itemButton = new ActionRowBuilder();
                                    itemButton.addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('categoryButton')
                                            .setStyle(ButtonStyle.Success)
                                            .setLabel('下一步'),
                                    );

                                    const itemResponse = await itemInteraction.editReply({
                                        content: '請選擇裝備:',
                                        components: [...itemRows, itemButton],
                                        ephemeral: true
                                    })


                                    const itemCollector = await itemResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });

                                    itemCollector.on('collect', i => {
                                        i.deferUpdate();
                                        const itemSelected = dataObj[i.user.id].itemSelected || []
                                        itemSelected.push(i.values[0])
                
                                        dataObj[i.user.id] = {
                                            ...dataObj[i.user.id],
                                            itemSelected
                                        }
                                    });

                                    itemResponse.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 })
                                        .then(async remarkInteraction => {

                                            const ignInput = new TextInputBuilder()
                                                .setCustomId(`ign`)
                                                .setLabel(`遊戲內名稱(大小寫需一至)`)
                                                .setStyle(TextInputStyle.Short)
                                                .setPlaceholder('請輸入遊戲內名稱(大小寫需一至)')
                                                .setRequired(true)

                                            const remarkInput = new TextInputBuilder()
                                                .setCustomId(`remark`)
                                                .setLabel(`OC爆裝補裝事項備註`)
                                                .setStyle(TextInputStyle.Short)
                                                .setPlaceholder('請輸入備註(可不填)')
                                                .setRequired(false)


                                            const modal = new ModalBuilder()
                                                .setCustomId('remark')
                                                .setTitle('OC爆裝補裝事項備註');

                                            const ignRow = new ActionRowBuilder().addComponents(ignInput)
                                            const remarkRow = new ActionRowBuilder().addComponents(remarkInput)

                                            modal.addComponents(ignRow);
                                            modal.addComponents(remarkRow);


                                            await remarkInteraction.showModal(modal);

                                           await remarkInteraction.awaitModalSubmit({filter : i => i.user.id === remarkInteraction.user.id, time: 60_000 })
                                               .then(async fainaInteraction => {

                                                   const fields = fainaInteraction.fields.fields.map(field => field)

                                                   const json = dataObj[fainaInteraction.user.id].itemSelected.reduce((prev, current) => {
                                                       const jsonObj = JSON.parse(current)

                                                       let t = jsonObj.t

                                                       if (jsonObj.t == '平9') {
                                                           t = '平8.1'
                                                       } else if (jsonObj.t === '平10') {
                                                           t = '平8.2'
                                                       } else if (jsonObj.t === '平11') {
                                                           t = '平8.3'
                                                       }

                                                       if (jsonObj.parts === '頭') {
                                                           prev.head = `${t?.replace('平', 'T')}${jsonObj.name}`
                                                       } else if (jsonObj.parts === '身') {
                                                           prev.armor = `${t?.replace('平', 'T')}${jsonObj.name}`
                                                       } else if (jsonObj.parts === '腳') {
                                                           prev.shoes = `${t?.replace('平', 'T')}${jsonObj.name}`
                                                       } else if (jsonObj.parts === '副手') {
                                                           prev.offHand = `${t?.replace('平', 'T')}${jsonObj.name}`
                                                       } else if (jsonObj.parts === '武器') {
                                                           prev.weapon = `${jsonObj.t?.replace('平', 'T')}${jsonObj.name}`
                                                       }
                                                       return { ...prev }
                                                   }, {})

                                                   const userId = fainaInteraction.user.id

                                                   fainaInteraction.reply({ content: 'OC爆裝補裝申請完成。', ephemeral: true })
                                                //    fainaInteraction.guild.channels.cache.get('1012789487715229746').send(dataObj[userId].attachments)
                                                //    fainaInteraction.guild.channels.cache.get('1012789487715229746').send(`<@${interaction.user.id}> 已申請OC爆裝補裝。`)
                                                //    fainaInteraction.guild.channels.cache.get('1012789487715229746').send(`備註 : ${fields[1].value || '無'} `)

                                                   await ocAdd({
                                                       ...json,
                                                       isFighter: dataObj[userId].isFighter,
                                                       eventId: dataObj[userId].attachments,
                                                       remark: fields[1].value,
                                                       name: fields[0].value
                                                   })

                                                   delete dataObj.userId

                                               })
                                        })

                                })

                        })

                })

        })
}