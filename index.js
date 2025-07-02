const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const allowedRoles = [
  '1389484755296452649',
  '1389485202383966228',
  '1389485400334143588',
  '1389485740374622319'
];

const TICKET_CHANNEL_ID = '1389482026528145418';

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Register the /tickets slash command
  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel embed.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  (async () => {
    try {
      console.log('🔁 Registering /tickets command...');
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [command.toJSON()] }
      );
      console.log('✅ Command registered!');
    } catch (err) {
      console.error('❌ Failed to register command:', err);
    }
  })();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'tickets') {
    const memberRoles = interaction.member.roles;
    const hasAccess = allowedRoles.some(roleId => memberRoles.cache.has(roleId));

    if (!hasAccess) {
      return interaction.reply({
        content: '❌ You don’t have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket Support Panel')
      .setDescription('Click the button below to open a support ticket.\nOur team will assist you shortly.')
      .setColor(0x9146FF);

    const targetChannel = client.channels.cache.get(TICKET_CHANNEL_ID);
    if (!targetChannel) {
      return interaction.reply({
        content: '❌ Could not find the ticket channel.',
        ephemeral: true
      });
    }

    await targetChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Ticket panel sent!',
      ephemeral: true
    });
  }
});

client.login(TOKEN);
