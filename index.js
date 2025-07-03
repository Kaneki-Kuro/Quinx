const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Events,
  Partials
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel with dropdown options.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  (async () => {
    try {
      console.log('📤 Registering /tickets command...');
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [command.toJSON()] }
      );
      console.log('✅ Command registered.');
    } catch (err) {
      console.error('❌ Failed to register command:', err);
    }
  })();
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'tickets') {
    const botAvatar = client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Quinx | Support', iconURL: botAvatar })
      .setTitle('🟣 Need Help? Open a Ticket!')
      .setDescription(
        '**Click the dropdown below to open a ticket in your category.**\n\n' +
        '__**Please follow these rules:**__\n' +
        '• Be respectful to staff and others.\n' +
        '• Do not open multiple tickets for the same issue.\n' +
        '• Provide clear and detailed information.\n' +
        '• Abuse of the system will result in punishment.\n\n' +
        '![support gif](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGQzOGZiODRiNGRjYzRiMzkwOWQ1MDMwM2VkZDRhMzUzYmMxZDEzMyZjdD1n/WUlplcMpOCEmTGBtBW/giphy.gif)'
      )
      .setColor(0x9146ff)
      .setFooter({ text: 'Quinx Support System' })
      .setTimestamp();

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        {
          label: 'General Support',
          description: 'Help with general issues.',
          value: 'general_support',
          emoji: '🛠️'
        },
        {
          label: 'Staff Applications',
          description: 'Apply for a staff position.',
          value: 'staff_app',
          emoji: '📝'
        },
        {
          label: 'Report a Staff',
          description: 'Report a team member.',
          value: 'report_staff',
          emoji: '🚫'
        },
        {
          label: 'Punishment Appeal',
          description: 'Appeal a punishment.',
          value: 'punishment_appeal',
          emoji: '📄'
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const value = interaction.values[0];
    const readable = value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    await interaction.reply({
      content: `✅ You selected: **${readable}**`,
      flags: 64 // Ephemeral
    });

    // TODO: Add ticket channel creation logic here
  }
});

client.login(TOKEN);

// Optional Express server for uptime or Render Web Service
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Quinx Ticket Bot is running!');
});

app.listen(port, () => {
  console.log(`🌐 Web server is running on port ${port}`);
});
