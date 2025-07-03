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
  Partials,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder
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
  general_support: { id: '1390195522412744768', prefix: 'g.s' },
  bug_report: { id: '1390201414017355926', prefix: 'b.r' },
  punishment_appeal: { id: '1390197290051960832', prefix: 'p.a' },
  staff_app: { id: '1390195994221871114', prefix: 's.a' },
  report_staff: { id: '1390196998321475644', prefix: 'r.s' }
};

const typeMap = {
  'g.s': 'General Support',
  'b.r': 'Bug Report',
  'p.a': 'Punishment Appeal',
  's.a': 'Staff Application',
  'r.s': 'Report a Staff'
};

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel with dropdown options.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('📤 Registering /tickets command...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [command.toJSON()] });
    console.log('✅ Command registered.');
  } catch (err) {
    console.error('❌ Failed to register command:', err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'tickets') {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Quinx | Support', iconURL: client.user.displayAvatarURL() })
      .setDescription(`**Click the dropdown below to open a ticket in your category.**\n\n__**Please follow these rules:**__\n• Be respectful to staff and others.\n• Do not open multiple tickets for the same issue.\n• Provide clear and detailed information.\n• Abuse of the system will result in punishment.`)
      .setImage('https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif')
      .setColor(0x9146ff);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        { label: 'General Support', value: 'general_support', emoji: '<:gs:1390200221358751825>', description: 'Apply for discord or in-game support' },
        { label: 'Bug Report', value: 'bug_report', emoji: '<:bug:1390200200039108719>', description: 'Report a bug found in game or discord' },
        { label: 'Punishment Appeal', value: 'punishment_appeal', emoji: '<:pa:1390200212248858744>', description: 'Appeal a punishment' },
        { label: 'Staff Application', value: 'staff_app', emoji: '<:sa:1390200218485788763>', description: 'Apply for staff position.' },
        { label: 'Report a Staff', value: 'report_staff', emoji: '<:rs:1390200207987445780>', description: 'Report a member from staff' }
      );

    await interaction.reply({ ephemeral: true, content: '✅ Ticket panel sent!' });

    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const value = interaction.values[0];
    const modal = new ModalBuilder().setCustomId(`${value}_form`).setTitle(`Ticket Form: ${value.replace(/_/g, ' ')}`);

    const short = TextInputStyle.Short;
    const para = TextInputStyle.Paragraph;

    if (value === 'general_support') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('What is your in-game name?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('section').setLabel('Which section is your issue related to?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('What type of issue are you facing?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Brief description of the issue').setStyle(para).setRequired(true))
      );
    } else if (value === 'bug_report') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('platform').setLabel('Which platform is the bug on?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gamemode').setLabel('Which section or gamemode is affected?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bugdesc').setLabel('Brief description of the bug').setStyle(para).setRequired(true))
      );
    } else if (value === 'punishment_appeal') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('punish_type').setLabel('What punishment did you receive?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('who').setLabel('Who punished you?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('Why were you punished?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('why_remove').setLabel('Why should it be removed or reduced?').setStyle(para).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('honesty').setLabel('Are you being honest in this appeal?').setStyle(short).setRequired(true))
      );
    } else if (value === 'staff_app') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('username').setLabel('What is your in-game username?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('timezone').setLabel('What is your time zone/region?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('age').setLabel('How old are you?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('punishments').setLabel('Have you been previously punished on Quinx?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('strengths').setLabel('What are your personal strengths?').setStyle(para).setRequired(true))
      );
    } else if (value === 'report_staff') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reported').setLabel('Which staff member are you reporting?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('wrongdoing').setLabel('What did the staff member do wrong?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('incident_time').setLabel('When did this incident occur?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('location').setLabel('Where did it happen?').setStyle(short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('proof').setLabel('Do you have any proof?').setStyle(para).setRequired(true))
      );
    }

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ ephemeral: true });
    const formType = interaction.customId.split('_form')[0];
    const config = categoryMap[formType];
    if (!config) return;

    const channel = await interaction.guild.channels.create({
      name: `${config.prefix}-${Math.floor(Math.random() * 9000) + 1000}`,
      type: 0,
      parent: config.id,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: ['ViewChannel']
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'AttachFiles', 'EmbedLinks']
        },
        {
          id: '1389488347126435942', // support role
          allow: ['ViewChannel', 'SendMessages', 'ManageMessages']
        }
      ]
    });

    const fields = interaction.fields.fields;
    const embed = new EmbedBuilder()
      .setTitle(`📩 ${formType.replace(/_/g, ' ').toUpperCase()} Ticket`)
      .setColor(0x9146ff)
      .addFields([...fields].map(([key, val]) => ({
        name: key.replace(/_/g, ' '),
        value: `\`\`\`${val.value}\`\`\``
      })))
      .setTimestamp();

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${interaction.user.id}> <@&1389488347126435942> opened a ticket.`,
      embeds: [embed],
      components: [closeBtn]
    });

    await interaction.editReply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const transcript = sorted.map(msg =>
      `[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}: ${msg.content}`
    ).join('\n');

    const file = new AttachmentBuilder(Buffer.from(transcript, 'utf-8'), {
      name: `${channel.name}_transcript.txt`
    });

    const firstMsg = sorted.find(m => m.content.includes('<@') && m.content.includes('opened a ticket.'));
    const userId = firstMsg?.mentions?.users?.first()?.id;
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    const displayName = member?.displayName || 'Unknown';
    const username = member?.user?.tag || 'Unknown#0000';
    const prefix = channel.name.split('-')[0];
    const category = typeMap[prefix] || 'Unknown';

    const logChannel = await interaction.guild.channels.fetch('1390264064105513030');
    if (logChannel) {
      await logChannel.send({
        content: `${displayName} ( ${username} )'s ${category} transcript`,
        files: [file]
      });
    }

    await interaction.reply({ content: '🗑️ Ticket will be deleted in 5 seconds...', ephemeral: true });
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  }
});

client.login(TOKEN);

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Quinx Ticket Bot is running!'));
app.listen(port, () => console.log(`🌐 Web server is running on port ${port}`));
