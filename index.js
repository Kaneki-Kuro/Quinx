const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
  Events,
  Partials
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
  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const value = interaction.values[0];
    const modal = new ModalBuilder().setCustomId(`${value}_form`).setTitle(`Ticket Form: ${value.replace(/_/g, ' ')}`);

    if (value === 'general_support') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('What is your in-game-name?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('section').setLabel('Which gamemode/section is your issue related to?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('What type of issue are you facing?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Brief description').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    } else if (value === 'bug_report') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('platform').setLabel('Which platform is the bug on?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gamemode').setLabel('Which section/gamemode is affected?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bugdesc').setLabel('Brief Description of the Bug').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    } else if (value === 'punishment_appeal') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('punish_type').setLabel('What punishment did you receive?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('who').setLabel('Who punished you?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Why were you punished?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why_remove').setLabel('Why should we remove or reduce the punishment?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('honesty').setLabel('Are you being honest in this appeal?').setStyle(TextInputStyle.Short).setRequired(true))
      );
    } else if (value === 'staff_app') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('username').setLabel('What is your in-game username?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timezone').setLabel('What is your time zone/region?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('How old are you?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('punishments').setLabel('Have you been previously punished on Quinx?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('strengths').setLabel('What are your personal strengths?').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    } else if (value === 'report_staff') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reported').setLabel('Which staff member are you reporting?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('wrongdoing').setLabel('What did the staff member do wrong?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('incident_time').setLabel('When did this incident occur? (Date & Time)').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('location').setLabel('Where did it happen?').setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Do you have any proof?').setStyle(TextInputStyle.Paragraph).setRequired(true))
      );
    }

    return await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {   
    await interaction.deferReply({ ephemeral: true });
    const formType = interaction.customId.split('_form')[0];
    const config = categoryMap[formType];
    if (!config) return;

    const channel = await interaction.guild.channels.create({
      name: `${config.prefix}-${Math.floor(Math.random() * 9000) + 1000}`,
      type: 0,
      parent: config.id
    });

    const fields = interaction.fields.fields;
    const embed = new EmbedBuilder()
      .setTitle(`📩 ${formType.replace(/_/g, ' ').toUpperCase()} Ticket`)
      .setColor(0x9146ff)
      .addFields(
        [...fields].map(([key, val]) => ({ name: key.replace(/_/g, ' '), value: val.value }))
      )
      .setTimestamp();

    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    await channel.send({ content: `🎫 <@${interaction.user.id}> opened a ticket.`, embeds: [embed] });
  }
});

client.login(TOKEN);

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 Quinx Ticket Bot is running!');
});

app.listen(port, () => {
  console.log(`🌐 Web server is running on port ${port}`);
});
