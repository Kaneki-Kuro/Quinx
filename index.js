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
const fs = require('fs');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TRANSCRIPT_CHANNEL_ID = '1390264064105513030';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const categoryMap = {
  general_support: { id: '1390195522412744768', prefix: 'g.s' },
  bug_report: { id: '1390201414017355926', prefix: 'b.r' },
  punishment_appeal: { id: '1390197290051960832', prefix: 'p.a' },
  staff_app: { id: '1390195994221871114', prefix: 's.a' },
  report_staff: { id: '1390196998321475644', prefix: 'r.s' }
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
      .setDescription(`**Click the dropdown below to open a ticket in your category.**\n\n__**Please follow these rules:**__\n• Be respectful to staff and others.\n• Do not open multiple tickets for the same issue.\n• Provide clear and detailed information.\n• Abuse of the system will result in punishment.\n\n![ ](https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif)`)  
      .setColor(0x9146ff);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Select a ticket type...')
      .addOptions(
        {
          label: 'General Support',
          description: 'Apply for discord or in-game support',
          value: 'general_support',
          emoji: '<:gs:1390200221358751825>'
        },
        {
          label: 'Bug Report',
          description: 'Report a bug found in game or discord',
          value: 'bug_report',
          emoji: '<:bug:1390200200039108719>'
        },
        {
          label: 'Punishment Appeal',
          description: 'Appeal a punishment',
          value: 'punishment_appeal',
          emoji: '<:pa:1390200212248858744>'
        },
        {
          label: 'Staff Application',
          description: 'Apply for staff position.',
          value: 'staff_app',
          emoji: '<:sa:1390200218485788763>'
        },
        {
          label: 'Report a Staff',
          description: 'Report a member from staff',
          value: 'report_staff',
          emoji: '<:rs:1390200207987445780>'
        }
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Ticket panel sent!', flags: 64 });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
    const value = interaction.values[0];
    const modal = new ModalBuilder().setCustomId(`${value}_form`).setTitle(`Ticket Form: ${value.replace(/_/g, ' ')}`);

    const short = (id, label) => new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(TextInputStyle.Short).setRequired(true);
    const long = (id, label) => new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(TextInputStyle.Paragraph).setRequired(true);

    if (value === 'bug_report') {
      modal.addComponents(
        new ActionRowBuilder().addComponents(short('platform', 'Which platform is the bug on?')),
        new ActionRowBuilder().addComponents(short('gamemode', 'Which gamemode or section is affected?')),
        new ActionRowBuilder().addComponents(long('bugdesc', 'Describe the bug in detail.'))
      );
    }

    return await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    await interaction.deferReply({ flags: 64 });
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
        [...fields].map(([key, val]) => ({
          name: val.label,
          value: `\`\`${val.value}\`\``
        }))
      )
      .setTimestamp();

    await interaction.editReply({ content: `✅ Ticket created: ${channel}` });
    await channel.send({ content: `<@${interaction.user.id}> <@&1389488347126435942> opened a ticket.`, embeds: [embed], components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
      )
    ] });
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Are you sure you want to close this ticket?')
      .setColor(0xffcc00);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_close').setLabel('Yes').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_close').setLabel('No').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [confirmEmbed], components: [row], flags: 64 });
  }

  if (interaction.isButton() && interaction.customId === 'cancel_close') {
    await interaction.message.delete();
    await interaction.reply({ content: '❌ Ticket close canceled.', flags: 64 });
  }

  if (interaction.isButton() && interaction.customId === 'confirm_close') {
    const channel = interaction.channel;
    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const transcript = sorted.map(msg => {
      const author = msg.author?.tag || 'Unknown';
      const content = msg.content?.trim() || '[No message content]';
      return `[${new Date(msg.createdTimestamp).toLocaleString()}] ${author}: ${content}`;
    }).join('\n');

    const fileName = `transcript-${channel.name}.txt`;
    fs.writeFileSync(fileName, transcript);

    const member = interaction.guild.members.cache.find(m => channel.name.includes(m.user.username));
    const ticketUser = member?.user || interaction.user;
    const display = member?.displayName || ticketUser.username;
    const username = ticketUser.tag;

    const attachment = new AttachmentBuilder(fileName);
    const logChannel = await client.channels.fetch(TRANSCRIPT_CHANNEL_ID);
    await logChannel.send({
      content: `${display} ( ${username} )'s ${channel.name.split('-')[0]} transcript`,
      files: [attachment]
    });

    await ticketUser.send({
      content: `Here is a copy of your transcript from the ticket **${channel.name}**`,
      files: [attachment]
    }).catch(() => console.log('⚠️ Could not DM user.'));

    fs.unlinkSync(fileName);
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
