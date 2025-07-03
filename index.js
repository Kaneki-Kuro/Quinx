""// index.js - Full Ticket Bot with Dropdown, Modals, Close Confirmation & Transcripts

const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  Events
} = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL = '1390264064105513030'; // Transcript log channel
const TICKET_PING_ROLE = '1389488347126435942';

const categoryMap = {
  general_support: { id: '1390195522412744768', prefix: 'g.s' },
  bug_report: { id: '1390201414017355926', prefix: 'b.r' },
  punishment_appeal: { id: '1390197290051960832', prefix: 'p.a' },
  staff_app: { id: '1390195994221871114', prefix: 's.a' },
  report_staff: { id: '1390196998321475644', prefix: 'r.s' }
};

// Command registration
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const command = new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel with dropdown options.');

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [command.toJSON()] });
    console.log('✅ Command registered.');
  } catch (err) {
    console.error('❌ Failed to register command:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'tickets') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Quinx | Support', iconURL: client.user.displayAvatarURL() })
        .setDescription(`**Click the dropdown below to open a ticket in your category.**

__**Please follow these rules:**__
• Be respectful to staff and others.
• Do not open multiple tickets for the same issue.
• Provide clear and detailed information.
• Abuse of the system will result in punishment.`)
        .setImage('https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif')
        .setColor(0x9146ff);

      const menu = new StringSelectMenuBuilder()
        .setCustomId('ticket_reason')
        .setPlaceholder('Select a ticket type...')
        .addOptions(
          { label: 'General Support', description: 'Apply for discord or in-game support', value: 'general_support', emoji: '<:gs:1390200221358751825>' },
          { label: 'Bug Report', description: 'Report a bug found in game or discord', value: 'bug_report', emoji: '<:bug:1390200200039108719>' },
          { label: 'Punishment Appeal', description: 'Appeal a punishment', value: 'punishment_appeal', emoji: '<:pa:1390200212248858744>' },
          { label: 'Staff Application', description: 'Apply for staff position.', value: 'staff_app', emoji: '<:sa:1390200218485788763>' },
          { label: 'Report a Staff', description: 'Report a member from staff', value: 'report_staff', emoji: '<:rs:1390200207987445780>' }
        );

      const row = new ActionRowBuilder().addComponents(menu);
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_reason') {
      const value = interaction.values[0];
      const modal = new ModalBuilder().setCustomId(`${value}_form`).setTitle(`Ticket Form: ${value.replace(/_/g, ' ')}`);

      const questions = {
        general_support: [
          ['ign', 'What is your in-game name?'],
          ['section', 'Which gamemode or section is your issue related to?'],
          ['type', 'What type of issue are you facing?'],
          ['desc', 'Brief description of the issue']
        ],
        bug_report: [
          ['platform', 'Which platform is the bug on?'],
          ['gamemode', 'Which section/gamemode is affected?'],
          ['bugdesc', 'Brief description of the bug']
        ],
        punishment_appeal: [
          ['punish_type', 'What punishment did you receive?'],
          ['who', 'Who punished you?'],
          ['reason', 'Why were you punished?'],
          ['why_remove', 'Why should we remove or reduce the punishment?'],
          ['honesty', 'Are you being honest in this appeal?']
        ],
        staff_app: [
          ['username', 'What is your in-game username?'],
          ['timezone', 'What is your time zone/region?'],
          ['age', 'How old are you?'],
          ['punishments', 'Have you been previously punished on Quinx?'],
          ['strengths', 'What are your personal strengths?']
        ],
        report_staff: [
          ['reported', 'Which staff member are you reporting?'],
          ['wrongdoing', 'What did the staff member do wrong?'],
          ['incident_time', 'When did this incident occur? (Date & Time)'],
          ['location', 'Where did it happen?'],
          ['proof', 'Do you have any proof?']
        ]
      };

      const rows = questions[value].map(([id, label]) =>
        new ActionRowBuilder().addComponents(new TextInputBuilder()
          .setCustomId(id)
          .setLabel(label.slice(0, 45))
          .setStyle(label.toLowerCase().includes('brief') || label.toLowerCase().includes('proof') ? TextInputStyle.Paragraph : TextInputStyle.Short)
          .setRequired(true))
      );

      modal.addComponents(...rows);
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      const formType = interaction.customId.split('_form')[0];
      const config = categoryMap[formType];
      if (!config) return;

      const ticketName = `${config.prefix}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: config.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
          }
        ]
      });

      const fields = interaction.fields.fields;
      const embed = new EmbedBuilder()
        .setTitle(`📩 ${formType.replace(/_/g, ' ').toUpperCase()} Ticket`)
        .setColor(0x9146ff)
        .setTimestamp()
        .addFields([...fields].map(([key, val]) => ({
          name: key.replace(/_/g, ' ').replace(/\w/g, l => l.toUpperCase()),
          value: `\`\`\`${val.value}\`\`\``
        })));

      const closeBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('confirm_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `<@${interaction.user.id}> <@&${TICKET_PING_ROLE}> opened a ticket.`,
        embeds: [embed],
        components: [closeBtn]
      });

      await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'confirm_close') {
      const confirmEmbed = new EmbedBuilder()
        .setDescription('Are you sure you want to close this ticket?')
        .setColor(0xff0000);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('yes_close').setLabel('Yes').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('no_close').setLabel('No').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'yes_close') {
      const channel = interaction.channel;
      const messages = await channel.messages.fetch({ limit: 100 });
      const user = messages.find(m => m.content?.includes('<@') && m.mentions.users.size)?.mentions.users.first() || interaction.user;

      const transcript = messages
        .filter(m => !m.author.bot)
        .reverse()
        .map(m => `${m.author.tag}: ${m.content}`)
        .join('
') || 'No messages recorded.';

      const logEmbed = new EmbedBuilder()
        .setTitle(`📝 Transcript: ${channel.name}`)
        .setDescription(`${user.displayName} ( ${user.username} )'s ${channel.name.split('-')[0]} transcript`)
        .setColor(0x9146ff)
        .setTimestamp();

      await client.channels.cache.get(LOG_CHANNEL)?.send({ embeds: [logEmbed], files: [{ attachment: Buffer.from(transcript), name: `${channel.name}-transcript.txt` }] });
      await user.send({ content: `📝 Here is the transcript of your ticket \`${channel.name}\`:`, files: [{ attachment: Buffer.from(transcript), name: `${channel.name}-transcript.txt` }] }).catch(() => {});

      await channel.delete();
    }

    if (interaction.isButton() && interaction.customId === 'no_close') {
      await interaction.message.delete().catch(() => {});
    }
  } catch (err) {
    console.error('❌ Error handling interaction:', err);
  }
});

client.login(TOKEN);

// Web ping
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('🤖 Quinx Ticket Bot is running!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web server is running.'));
""
