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

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Slash command registration
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

client.on(Events.InteractionCreate, async interaction => {
  // Slash command logic
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'tickets') {
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
            description: 'Help with anything general.',
            value: 'general_support'
          },
          {
            label: 'Staff Applications',
            description: 'Apply to become a staff member.',
            value: 'staff_app'
          },
          {
            label: 'Report a Staff',
            description: 'Report a team member.',
            value: 'report_staff'
          },
          {
            label: 'Punishment Appeal',
            description: 'Appeal a ban or punishment.',
            value: 'punishment_appeal'
          }
        );

      const row = new ActionRowBuilder().addComponents(dropdown);

      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: false
      });
    }
  }

  // Dropdown selection logic
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_reason') {
      const selection = interaction.values[0];

      await interaction.reply({
        content: `✅ You selected: **${selection.replace('_', ' ')}**.\n(You can now implement channel creation logic here.)`,
        ephemeral: true
      });

      // TODO: Create ticket channel depending on selection
    }
  }
});

client.login(TOKEN);
