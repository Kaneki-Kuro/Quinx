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

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// Register /tickets on startup
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel dropdown.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  (async () => {
    try {
      console.log('🔁 Registering /tickets...');
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [command.toJSON()] }
      );
      console.log('✅ /tickets registered.');
    } catch (err) {
      console.error('❌ Slash command error:', err);
    }
  })();
});

// Handle /tickets and dropdown
client.on(Events.InteractionCreate, async interaction => {
  // Slash Command: /tickets
  if (interaction.isChatInputCommand() && interaction.commandName === 'tickets') {
    const embed = new EmbedBuilder()
      .setTitle('🎫 Create a Ticket')
      .setDescription('Please select the reason for your ticket from the dropdown below.')
      .setColor(0x9146FF);

    const dropdown = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        {
          label: 'General Support',
          description: 'Help with general inquiries.',
          value: 'general_support'
        },
        {
          label: 'Staff Applications',
          description: 'Apply for staff position.',
          value: 'staff_app'
        },
        {
          label: 'Report a Staff',
          description: 'Report a team member.',
          value: 'report_staff'
        },
        {
          label: 'Punishment Appeal',
          description: 'Appeal a punishment.',
          value: 'punishment_appeal'
        }
      );

    const row = new ActionRowBuilder().addComponents(dropdown);

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  // Dropdown menu selected
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const selection = interaction.values[0];
    const formatted = selection.replace('_', ' ').replace(/(^|\s)\S/g, l => l.toUpperCase());

    await interaction.reply({
      content: `✅ You selected: **${formatted}**`,
      flags: 64 // 64 = ephemeral message
    });

    // TODO: Here you can add logic to create channels based on selection
  }
});

client.login(TOKEN);
