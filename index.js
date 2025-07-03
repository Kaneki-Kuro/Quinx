// index.js
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
  ButtonBuilder,
  ButtonStyle,
  Events,
  Partials,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

const categoryMap = {
  general_support: { id: '1390195522412744768', prefix: 'g.s' },
  bug_report: { id: '1390201414017355926', prefix: 'b.r' },
  punishment_appeal: { id: '1390197290051960832', prefix: 'p.a' },
  staff_app: { id: '1390195994221871114', prefix: 's.a' },
  report_staff: { id: '1390196998321475644', prefix: 'r.s' }
};

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel with dropdown options.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);

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
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'tickets') {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Quinx | Support', iconURL: client.user.displayAvatarURL() })
      .setDescription('**Click the dropdown below to open a ticket in your category.**')
      .setImage('https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif')
      .setColor(0x9146ff);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        { label: 'General Support', value: 'general_support', emoji: '<:gs:1390200221358751825>' },
        { label: 'Bug Report', value: 'bug_report', emoji: '<:bug:1390200200039108719>' },
        { label: 'Punishment Appeal', value: 'punishment_appeal', emoji: '<:pa:1390200212248858744>' },
        { label: 'Staff Application', value: 'staff_app', emoji: '<:sa:1390200218485788763>' },
        { label: 'Report a Staff', value: 'report_staff', emoji: '<:rs:1390200207987445780>' }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const value = interaction.values[0];
    const modal = new ModalBuilder().setCustomId(`${value}_form`).setTitle(`Ticket Form: ${value.replace(/_/g, ' ')}`);

    const short = TextInputStyle.Short;
    const para = TextInputStyle.Paragraph;

    if (value === 'general_support') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ign').setLabel('Your in-game name?').setStyle(short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('section').setLabel('Which game section is it related to?').setStyle(short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('type').setLabel('Type of issue?').setStyle(short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('desc').setLabel('Describe your issue.').setStyle(para))
      );
    }
    if (value === 'bug_report') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('platform').setLabel('Which platform is the bug on?').setStyle(short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('gamemode').setLabel('Affected gamemode/section?').setStyle(short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('bugdesc').setLabel('Describe the bug.').setStyle(para))
      );
    }
    // Add other modals here as needed...

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    const formType = interaction.customId.split('_form')[0];
    const config = categoryMap[formType];
    if (!config) return;

    const channel = await interaction.guild.channels.create({
      name: `${config.prefix}-${Math.floor(Math.random() * 9000) + 1000}`,
      type: ChannelType.GuildText,
      parent: config.id,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });

    const fields = interaction.fields.fields;
    const embed = new EmbedBuilder()
      .setTitle(`📩 ${formType.replace(/_/g, ' ').toUpperCase()} Ticket`)
      .setColor(0x9146ff)
      .addFields(
        [...fields].map(([key, val]) => ({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: `\`${val.value}\``
        }))
      );

    await channel.send({
      content: `<@${interaction.user.id}> <@&1389488347126435942> opened a ticket.`,
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('close_ticket').setLabel('Close').setStyle(ButtonStyle.Danger)
        )
      ]
    });

    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Are you sure you want to close this ticket?')
      .setColor('Red');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_close').setLabel('Yes').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_close').setLabel('No').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'cancel_close') {
    await interaction.message.delete();
  }

  if (interaction.isButton() && interaction.customId === 'confirm_close') {
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const transcript = sorted.map(m => `${m.author.tag}: ${m.content}`).join('\n');

    const filePath = `./transcript-${channel.id}.txt`;
    fs.writeFileSync(filePath, transcript);

    const user = channel.members.find(member => !member.user.bot);

    const transcriptEmbed = new EmbedBuilder()
      .setTitle(`${user?.displayName} ( ${user?.user.tag} )'s ${channel.name} transcript`)
      .setColor(0x9146ff)
      .setTimestamp();

    const logChannel = await client.channels.fetch('1390264064105513030');
    if (logChannel?.isTextBased()) {
      await logChannel.send({ embeds: [transcriptEmbed], files: [filePath] });
    }

    try {
      await user.send({ content: 'Here is your ticket transcript:', files: [filePath] });
    } catch (err) {
      console.log('❌ Could not send DM transcript:', err.message);
    }

    fs.unlinkSync(filePath);
    await channel.delete();
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
