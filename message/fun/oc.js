const {
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  ComponentType
} = require('discord.js');
const { queryByPartsThenGroupByCategory, queryByCategoryAndParts } = require("../../sql/table/items.js");
const ocAdd = require("../../ocAdd.js");
const logger = require('../../logger.js');

const SESSION = new Map(); // 用 Map 取代全域物件

module.exports = async (msg, attachments) => {
  const userId = msg.author.id;
  SESSION.set(userId, { attachments: attachments[0].url });

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('oc')
      .setStyle(ButtonStyle.Primary)
      .setLabel('點我以上方圖片申請補裝(Click To Apply)')
  );

  const response = await msg.reply({ components: [buttonRow], ephemeral: true });
  const buttonInteraction = await response.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 });

  await buttonInteraction.deferReply({ ephemeral: true });
  SESSION.get(userId).isFighter = false;

  const parts = ['頭HEAD', '身BODY', '腳LEG', '武器WEAPON', '副手OFFHAND'];
  const partOptions = parts.map(p => new StringSelectMenuOptionBuilder().setLabel(p).setValue(p));

  const partSelect = new StringSelectMenuBuilder()
    .setCustomId('part')
    .setPlaceholder('請選擇爆裝部位 Pls Select Breaked Part')
    .setMinValues(1)
    .setMaxValues(partOptions.length)
    .addOptions(partOptions);

  const partRow = new ActionRowBuilder().addComponents(partSelect);
  const nextButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('nextParts').setStyle(ButtonStyle.Success).setLabel('下一步 Next')
  );

  const partReply = await buttonInteraction.editReply({
    content: '請選擇爆裝部位（若含副手全爆請分兩次）',
    components: [partRow, nextButton]
  });

  const partCollector = partReply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });
  partCollector.on('collect', i => {
    i.deferUpdate();
    SESSION.get(userId).selected = i.values;
  });

  const nextInteraction = await partReply.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 });
  await nextInteraction.deferReply({ ephemeral: true });

  const tiers = ['平7', '平8', '平9', '平10', '平11'];
  const tierRows = SESSION.get(userId).selected.map((part, i) => {
    const options = tiers.map(t => new StringSelectMenuOptionBuilder().setLabel(`${part}-${t}`).setValue(JSON.stringify({ part, t })));
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder().setCustomId(`tier${i}`).setPlaceholder(`請選擇 ${part} 的T數`).addOptions(options)
    );
  });

  const tierNext = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('nextTier').setStyle(ButtonStyle.Success).setLabel('下一步 Next')
  );

  const tierReply = await nextInteraction.editReply({
    content: '請選擇T數:',
    components: [...tierRows, tierNext]
  });

  const tierCollector = tierReply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });
  tierCollector.on('collect', i => {
    i.deferUpdate();
    const list = SESSION.get(i.user.id).tSelected || [];
    list.push(i.values[0]);
    SESSION.get(i.user.id).tSelected = list;
  });

  const catInteraction = await tierReply.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 });
  await catInteraction.deferReply({ ephemeral: true });

  const categoryRows = await Promise.all(
    SESSION.get(userId).tSelected.map(async (str, i) => {
      const json = JSON.parse(str);
      const categoryList = await queryByPartsThenGroupByCategory(json);
      const options = categoryList.map(c => new StringSelectMenuOptionBuilder().setLabel(`${json.part}-${c.category}`).setValue(JSON.stringify({ ...json, category: c.category })));
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`cat${i}`).setPlaceholder(`${json.part} 類別選擇`).addOptions(options)
      );
    })
  );

  const categoryNext = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('nextCat').setStyle(ButtonStyle.Success).setLabel('下一步 Next')
  );

  const catReply = await catInteraction.editReply({ content: '請選擇類別:', components: [...categoryRows, categoryNext] });

  const catCollector = catReply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });
  catCollector.on('collect', i => {
    i.deferUpdate();
    const list = SESSION.get(i.user.id).categorySelected || [];
    list.push(i.values[0]);
    SESSION.get(i.user.id).categorySelected = list;
  });

  const itemInteraction = await catReply.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 });
  await itemInteraction.deferReply({ ephemeral: true });

  const itemRows = await Promise.all(
    SESSION.get(userId).categorySelected.map(async (str, i) => {
      const json = JSON.parse(str);
      const items = await queryByCategoryAndParts(json);
      const options = items.map(({ name, en_name }) => {
        const t = convertTier(json.t);
        return new StringSelectMenuOptionBuilder().setLabel(`${t}-${name}-${en_name}`).setValue(JSON.stringify({ ...json, name }));
      });
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(`item${i}`).setPlaceholder(`${json.part} 裝備選擇`).addOptions(options)
      );
    })
  );

  const itemNext = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('final').setStyle(ButtonStyle.Success).setLabel('下一步 Next')
  );

  const itemReply = await itemInteraction.editReply({ content: '請選擇裝備:', components: [...itemRows, itemNext] });

  const itemCollector = itemReply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60_000 });
  itemCollector.on('collect', i => {
    i.deferUpdate();
    const list = SESSION.get(i.user.id).itemSelected || [];
    list.push(i.values[0]);
    SESSION.get(i.user.id).itemSelected = list;
  });

  const modalInteraction = await itemReply.awaitMessageComponent({ componentType: ComponentType.Button, time: 60_000 });

  const ignInput = new TextInputBuilder()
    .setCustomId('ign')
    .setLabel('遊戲內名稱')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const remarkInput = new TextInputBuilder()
    .setCustomId('remark')
    .setLabel('補裝備註')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const modal = new ModalBuilder()
    .setCustomId('remark')
    .setTitle('OC爆裝補裝申請')
    .addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(remarkInput)
    );

  await modalInteraction.showModal(modal);
  const finalModal = await modalInteraction.awaitModalSubmit({ filter: i => i.user.id === userId, time: 60_000 });

  const fields = Object.fromEntries(finalModal.fields.fields.map(f => [f.customId, f.value]));
  const final = buildFinalJson(SESSION.get(userId).itemSelected);

  await finalModal.reply({ content: '補裝申請完成。Complete.', ephemeral: true });
  await ocAdd({
    ...final,
    isFighter: SESSION.get(userId).isFighter,
    eventId: SESSION.get(userId).attachments,
    remark: fields.remark,
    name: fields.ign
  });

  SESSION.delete(userId);
};

function convertTier(t) {
  return t === '平9' ? '平8.1' : t === '平10' ? '平8.2' : t === '平11' ? '平8.3' : t;
}

function buildFinalJson(selected) {
  return selected.reduce((acc, current) => {
    const { parts, t, name } = JSON.parse(current);
    const prefix = t.replace('平', 'T');
    const val = parts.includes('副手') || parts.includes('武器') ? `${prefix}${name}` : `T8${name}`;
    if (parts === '頭HEAD') acc.head = val;
    if (parts === '身BODY') acc.armor = val;
    if (parts === '腳LEG') acc.shoes = val;
    if (parts === '副手OFFHAND') acc.offHand = val;
    if (parts === '武器WEAPON') acc.weapon = val;
    return acc;
  }, {});
}
