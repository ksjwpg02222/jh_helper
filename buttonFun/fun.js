const logger = require("../logger")
const { Events, SlashCommandBuilder, TextInputStyle, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, TextInputBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ComponentType, Client } = require('discord.js');
const { queryByPartsThenGroupByCategory } = require("../sql/table/item.js")

module.exports = async (interaction) => {

    if (interaction.customId == 'test') {
        console.log(interaction)
    }

    if (interaction.customId == 'oc') {
        console.log('test123123')

        // interaction.user.send('test')
        // .then(() => {
        //     interaction.channel.awaitMessages({ max: 1, time: 30000, errors: ['time'] })
        //         .then(collected => {
        //             interaction.followUp(`got the correct answer!`);
        //         })
        //         .catch(collected => {
        //             interaction.followUp('Looks like nobody got the answer this time.');
        //         });
        // });

        // await interaction.deferReply({ ephemeral: true });

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

        const response = await interaction.update({
            content: '請選擇爆裝部位:',
            components: [row]
        });

        const collector = await response.awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 15000 });

        console.log(collector)

        // const selection = collector.values

        // await collector.deferReply();


        // const t = ['平7', '平8', '平9', '平10', '平11']

        // const component = selection.map((select, index) => {
        //     const items = t.map((t) => {
        //         const json = { parts: select, t: t }
        //         return new StringSelectMenuOptionBuilder()
        //             .setLabel(t)
        //             .setValue(JSON.stringify(json))
        //     })

        //     return new StringSelectMenuBuilder()
        //         .setCustomId(`t${index}`)
        //         .setPlaceholder(`請選擇 "${select}" 的T數`)
        //         .addOptions(items)
        // })

        // const rows = component.map(c => new ActionRowBuilder().addComponents(c))

        // let button = new ActionRowBuilder();
        // button.addComponents(
        //     new ButtonBuilder()
        //         .setCustomId('test')
        //         .setStyle(ButtonStyle.Success)
        //         .setLabel('下一步'),
        // );

        // const response = collector.editReply({
        //     content: '請選擇T數:',
        //     components: [...rows]
        // });

        // const test = await response.awaitMessageComponent({ componentType: ComponentType.StringSelect, time: 15000 });
        // console.log(test)

        // collector.on('collect', async i => {
        //     console.log('fuck')
        //     await i.deferReply();

        //     const selection = i.values

        //     const t = ['平7', '平8', '平9', '平10', '平11']


        //     const component = selection.map((select, index) => {
        //         const items = t.map((t) => {
        //             const json = { parts: select, t: t }
        //             return new StringSelectMenuOptionBuilder()
        //                 .setLabel(t)
        //                 .setValue(JSON.stringify(json))
        //         })

        //         return new StringSelectMenuBuilder()
        //             .setCustomId(`t${index}`)
        //             .setPlaceholder(`請選擇 "${select}" 的T數`)
        //             .addOptions(items)
        //     })



        //     const rows = component.map(c => new ActionRowBuilder().addComponents(c))


        //     let button = new ActionRowBuilder();
        //     button.addComponents(
        //         new ButtonBuilder()
        //             .setCustomId('test')
        //             .setStyle(ButtonStyle.Success)
        //             .setLabel('下一步'),
        //     );

        //     const response = await i.editReply({
        //         content: '請選擇T數:',
        //         components: [...rows, button]
        //     });

        //     const test = response.createMessageComponentCollector({  componentType: ComponentType.StringSelect, time: 15000 });

        //     test.on('end', collected => {
        //         console.log(collected.size);
        //     });
        // console.log(collector)

        // collector.on('collect', async i => {

        //     await i.deferReply();
        //     await i.deleteReply();
        //     test.push(i.values[0])

        // await i.deferReply();

        // const selection = i.values

        // const json = JSON.parse(selection)

        // const category = await queryByPartsThenGroupByCategory(json.parts)

        // const options =
        //     category.map(c => {
        //         logger.info(c.category)
        //         return new StringSelectMenuOptionBuilder()
        //             .setLabel(`${c.category}`)
        //             .setValue(JSON.stringify({ ...json, category: c.category }))
        //     })

        // const select = new StringSelectMenuBuilder()
        //     .setCustomId(`${json.t}_${json.parts}`)
        //     .setPlaceholder(`請選擇 ${json.parts} 的類別`)
        //     .addOptions(options);

        // const row = new ActionRowBuilder()
        //     .addComponents(select);

        // const response = await i.editReply({
        //     content: `請選擇類別 :`,
        //     components: [row]
        // });



        // const collector = response.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });

        // collector.on('collect', async i => {

        //     const selection = i.values

        //     i.reply({ content: `操根本是套娃${selection}` })

        // })
        // })
        // })






    }


}