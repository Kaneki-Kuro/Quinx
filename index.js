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

    if (value === 'staff_app') {
      const modal = new ModalBuilder()
        .setCustomId('staff_app_form')
        .setTitle('📋 Staff Application');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('username').setLabel('What is your in-game username?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('timezone').setLabel('What is your time zone/region?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('age').setLabel('How old are you?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('punishments').setLabel('Have you been previously punished on Quinx?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('strengths').setLabel('What are your personal strengths?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );

      return await interaction.showModal(modal);
    }

    if (value === 'report_staff') {
      const modal = new ModalBuilder()
        .setCustomId('report_staff_form')
        .setTitle('🚨 Report a Staff Member');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('staff_reported').setLabel('Which staff member are you reporting?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('wrongdoing').setLabel('What did the staff member do wrong?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('time').setLabel('When did this incident occur? (Date & Time)').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('location').setLabel('Where did it happen?').setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('proof').setLabel('Do you have any proof?').setStyle(TextInputStyle.Paragraph).setRequired(true)
        )
      );

      return await interaction.showModal(modal);
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === 'staff_app_form') {
    const answers = [
      { name: 'In-game Username', value: interaction.fields.getTextInputValue('username') },
      { name: 'Time Zone / Region', value: interaction.fields.getTextInputValue('timezone') },
      { name: 'Age', value: interaction.fields.getTextInputValue('age') },
      { name: 'Previous Punishments', value: interaction.fields.getTextInputValue('punishments') },
      { name: 'Strengths', value: interaction.fields.getTextInputValue('strengths') }
    ];

    const { id: categoryId, prefix } = categoryMap['staff_app'];
    const random = Math.floor(Math.random() * 9000) + 1000;
    const channelName = `${prefix}-${random}`;

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: 0,
      parent: categoryId
    });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });

    await channel.send({
      content: `🎫 <@${interaction.user.id}> has opened a **Staff Application** ticket.`,
      embeds: [
        new EmbedBuilder()
          .setTitle('📋 Staff Application Form')
          .addFields(...answers)
          .setColor(0x9146ff)
          .setTimestamp()
      ]
    });
  }

  if (interaction.isModalSubmit() && interaction.customId === 'report_staff_form') {
    const answers = [
      { name: 'Reported Staff Member', value: interaction.fields.getTextInputValue('staff_reported') },
      { name: 'What They Did', value: interaction.fields.getTextInputValue('wrongdoing') },
      { name: 'Time of Incident', value: interaction.fields.getTextInputValue('time') },
      { name: 'Location', value: interaction.fields.getTextInputValue('location') },
      { name: 'Proof', value: interaction.fields.getTextInputValue('proof') }
    ];

    const { id: categoryId, prefix } = categoryMap['report_staff'];
    const random = Math.floor(Math.random() * 9000) + 1000;
    const channelName = `${prefix}-${random}`;

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: 0,
      parent: categoryId
    });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });

    await channel.send({
      content: `🎫 <@${interaction.user.id}> has reported a **Staff Member**.`,
      embeds: [
        new EmbedBuilder()
          .setTitle('🚨 Staff Report Form')
          .addFields(...answers)
          .setColor(0xff4444)
          .setTimestamp()
      ]
    });
  }
});
