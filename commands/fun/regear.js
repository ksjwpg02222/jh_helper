// regear.js
const { 
  EmbedBuilder, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType
} = require('discord.js');
const axios = require('axios');
const config = require('../config'); // 依照實際路徑調整
const { CreateRegearEventIdFunc, pushData } = require('../services/regearService'); // 依照實際路徑調整

module.exports = {
  data: {
    name: 'regear'
  },
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const inGameName = interaction.options.getString('name');
    const userId = interaction.user.id;
    const member = interaction.member;

    const regearMeta = getRegearTier(member);
    if (!regearMeta) return replyNoRegear(interaction);

    const player = await fetchPlayerInfo(inGameName);
    if (!player) return replyNoPlayerFound(interaction);

    const deaths = await fetchRecentDeaths(player.Id);
    if (!deaths.length) return replyNoDeath(interaction);

    const deathOptions = buildDeathOptions(deaths);
    const deathEmbed = buildDeathEmbed(inGameName, deaths);

    const replyMessage = await showSelectMenu(interaction, deathEmbed, deathOptions);
    handleDeathSelection(replyMessage, deaths, {
      interaction,
      regearMeta,
      userId,
      isFighter: false
    });
  }
};

function getRegearTier(member) {
  if (member._roles.includes(config.T8_TAG_ID)) return { tier: 8, removeId: config.T8_TAG_ID };
  if (member._roles.includes(config.T9_TAG_ID)) return { tier: 9 };
  return null;
}

async function fetchPlayerInfo(name) {
  const { data } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/search?q=${name}`);
  return data.players.find(p => p.Name === name && p.GuildName === config.GUILD_NAME);
}

async function fetchRecentDeaths(playerId) {
  const { data } = await axios.get(`https://gameinfo-sgp.albiononline.com/api/gameinfo/players/${playerId}/deaths`);
  const now = Date.now();
  return data.filter(d => now - new Date(d.TimeStamp).getTime() < 5 * 86400000);
}

function buildDeathOptions(deaths) {
  return deaths.map((d, i) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`${i + 1}. [${d.Killer.GuildName}]${d.Killer.Name}`)
      .setDescription(`[${d.Killer.GuildName}]${d.Killer.Name} 殺了 [${d.Victim.GuildName}]${d.Victim.Name}`)
      .setValue(String(d.EventId))
  );
}

function buildDeathEmbed(name, deaths) {
  return new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(name)
    .setAuthor({ name: '補裝機器人' })
    .setDescription('最近 "五天內" 的死亡紀錄(新至舊，最多10筆)')
    .addFields(deaths.slice(0, 10).map((d, i) => ({
      name: `${i + 1}. [${d.Killer.GuildName}]${d.Killer.Name} 殺了 [${d.Victim.GuildName}]${d.Victim.Name}`,
      value: `https://albiononline.com/killboard/kill/${d.EventId}?server=live_sgp`
    })))
    .setTimestamp()
    .setFooter({ text: '補裝機器人' });
}

async function showSelectMenu(interaction, embed, options) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('starter')
    .setPlaceholder('請選擇欲申請補裝死亡紀錄 Pls Select Death Record')
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  return await interaction.editReply({
    content: '死亡紀錄選擇:',
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

function handleDeathSelection(message, deaths, context) {
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3600000 });

  collector.on('collect', async select => {
    const selected = deaths.filter(d => select.values.includes(String(d.EventId)));
    const modal = buildModal(selected);

    await select.showModal(modal);

    const modalResult = await select.awaitModalSubmit({
      filter: i => i.user.id === context.userId,
      time: 120000
    });

    await handleModalSubmission(modalResult, selected, context);
  });
}

function buildModal(deaths) {
  const modal = new ModalBuilder().setCustomId('regear').setTitle('補裝事項備註 Remark');

  deaths.forEach((d, i) => {
    const shortGuild = d.Killer.GuildName.split(' ').map(x => x[0]).join('').toUpperCase();
    const label = `${i + 1}. 被 [${shortGuild}]${d.Killer.Name} 殺了`;

    const input = new TextInputBuilder()
      .setCustomId(String(d.EventId))
      .setLabel(label.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('備註必填 (日期、時間、mass類型、caller)')
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
  });

  return modal;
}

async function handleModalSubmission(modal, deaths, context) {
  await modal.deferReply({ ephemeral: true });

  const remarks = Object.fromEntries(modal.fields.fields.map(f => [f.customId, f.value]));

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('補裝資訊 Info')
    .setAuthor({ name: '補裝機器人' })
    .setDescription('已送出補裝資料 Complete')
    .addFields(deaths.map((d, i) => ({
      name: `${i + 1}. 被 [${d.Killer.GuildName}]${d.Killer.Name} 殺了`,
      value: `備註:${remarks[d.EventId] || '無'}\nhttps://albiononline.com/killboard/kill/${d.EventId}?server=live_sgp`
    })))
    .setTimestamp()
    .setFooter({ text: '補裝機器人' });

  await modal.editReply({ embeds: [embed] });

  const member = modal.guild.members.cache.get(context.userId);
  if (context.regearMeta.removeId) await member.roles.remove(context.regearMeta.removeId);

  for (const id of Object.keys(remarks)) {
    try {
      await CreateRegearEventIdFunc(id);
      await pushData(id, remarks, context.isFighter, context.regearMeta.tier);
    } catch (error) {
      const url = `https://albiononline.com/killboard/kill/${id}?server=live_sgp`;
      const msg = error.name === 'SequelizeUniqueConstraintError'
        ? `${url} 補裝紀錄已存在`
        : `發生未知錯誤：${error.message}`;
      await modal.followUp({ content: msg, ephemeral: true });
    }
  }
}

function replyNoRegear(interaction) {
  return interaction.editReply({ content: '無補裝身分組', ephemeral: true });
}

function replyNoPlayerFound(interaction) {
  return interaction.editReply({ content: '查無輸入的查詢名稱成員', ephemeral: true });
}

function replyNoDeath(interaction) {
  return interaction.editReply({ content: '近五天內無任何死亡紀錄，請稍後再試', ephemeral: true });
}
