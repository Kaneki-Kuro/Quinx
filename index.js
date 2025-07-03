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
  Partials,
  PermissionFlagsBits
} = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

const categoryMap = {
  general_support: {
    id: '1390195522412744768',
    prefix: 'g.s'
  },
  bug_report: {
    id: '1390201414017355926',
    prefix: 'b.r'
  },
  punishment_appeal: {
    id: '1390197290051960832',
    prefix: 'p.a'
  },
  staff_app: {
    id: '1390195994221871114',
    prefix: 's.a'
  },
  report_staff: {
    id: '1390196998321475644',
    prefix: 'r.s'
  }
};

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
      .setDescription(
        '**Click the dropdown below to open a ticket in your category.**\n\n' +
        '__**Please follow these rules:**__\n' +
        '• Be respectful to staff and others.\n' +
        '• Do not open multiple tickets for the same issue.\n' +
        '• Provide clear and detailed information.\n' +
        '• Abuse of the system will result in punishment.'
      )
      .setColor(0x9146ff)
      .setFooter({ text: 'Quinx Support System' })
      .setTimestamp()
      .setImage('https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif?ex=68675fa3&is=68660e23&hm=451bd385cfd5fda278416fdafe7e354d979cdca271fba18d9b1e0555a614cfd7&');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        {
          label: 'General Support',
          description: 'Apply for discord or in-game support',
          value: 'general_support',
          emoji: { id: '1390200221358751825' }
        },
        {
          label: 'Bug Report',
          description: 'Report a bug found in game or discord',
          value: 'bug_report',
          emoji: { id: '1390200200039108719' }
        },
        {
          label: 'Punishment Appeal',
          description: 'Appeal a punishment',
          value: 'punishment_appeal',
          emoji: { id: '1390200212248858744' }
        },
        {
          label: 'Staff Application',
          description: 'Apply for staff position.',
          value: 'staff_app',
          emoji: { id: '1390200218485788763' }
        },
        {
          label: 'Report a Staff',
          description: 'Report a member from staff',
          value: 'report_staff',
          emoji: { id: '1390200207987445780' }
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
    const { id: categoryId, prefix } = categoryMap[value];
    const random = Math.floor(Math.random() * 9000) + 1000;
    const channelName = `${prefix}-${random}`;

    // Create ticket channel in category
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: 0, // GUILD_TEXT
      parent: categoryId,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ]
    });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });

    await channel.send({
      content: `🎫 <@${interaction.user.id}>, thank you for creating a ticket. Our team will be with you shortly!`
    });
  }
});

client.login(TOKEN);

// Optional Express server
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Quinx Ticket Bot is running!');
});

app.listen(port, () => {
  console.log(`🌐 Web server is running on port ${port}`);
});
