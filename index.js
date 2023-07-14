const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const logger = require('./logger.js');
const { RegearEventIds } = require("./sql/table/regearEventIds.js")
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const modalFunc = require("./modalFunc/fun.js")



client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.info(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, () => {
	RegearEventIds.sync()
	logger.info('Ready!');
});


client.on(Events.InteractionCreate, async interaction => {


	if (interaction.isModalSubmit) { modalFunc(interaction) }

	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	// if (!interaction.member._roles.some(role => role === '937291899792928798')) {
	// 	await interaction.reply({ content: '尚無JH身分組，如果有的話請詢問管理員。', ephemeral: true });
	// 	return
	// }

	try {

		logger.info(`${interaction.member.displayName} used ${interaction.commandName} command.`)
		await command.execute(interaction);
	} catch (error) {
		logger.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);