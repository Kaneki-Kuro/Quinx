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
const PING_ROLE_ID = '1389488347126435942';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
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
    const botAvatar = client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Quinx | Support', iconURL: botAvatar })
      .setDescription(`**Click the dropdown below to open a ticket in your category.**\n\n__**Please follow these rules:**__\n• Be respectful to staff and others.\n• Do not open multiple tickets for the same issue.\n• Provide clear and detailed information.\n• Abuse of the system will result in punishment.`)
      .setImage('https://cdn.discordapp.com/attachments/1389970577388998888/1390195161362857996/Ticket_GIF_banner.gif')
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

    const fields = {
      general_support: [
        { id: 'ign', label: 'What is your in-game-name?' },
        { id: 'section', label: 'Which section is your issue related to?' },
        { id: 'type', label: 'What type of issue are you facing?' },
        { id: 'desc', label: 'Brief description of your issue' }
      ],
      bug_report: [
        { id: 'platform', label: 'Which platform is the bug on?' },
        { id: 'gamemode', label: 'Which section/gamemode is affected?' },
        { id: 'bugdesc', label: 'Brief Description of the Bug' }
      ],
      punishment_appeal: [
        { id: 'punish_type', label: 'What punishment did you receive?' },
        { id: 'who', label: 'Who punished you?' },
        { id: 'reason', label: 'Why were you punished?' },
        { id: 'why_remove', label: 'Why should we remove or reduce the punishment?' },
        { id: 'honesty', label: 'Are you being honest in this appeal?' }
      ],
      staff_app: [
        { id: 'username', label: 'What is your in-game username?' },
        { id: 'timezone', label: 'What is your time zone/region?' },
        { id: 'age', label: 'How old are you?' },
        { id: 'punishments', label: 'Have you been previously punished on Quinx?' },
        { id: 'strengths', label: 'What are your personal strengths?' }
      ],
      report_staff: [
        { id: 'reported', label: 'Which staff member are you reporting?' },
        { id: 'wrongdoing', label: 'What did the staff member do wrong?' },
        { id: 'incident_time', label: 'When did this incident occur? (Date & Time)' },
        { id: 'location', label: 'Where did it happen?' },
        { id: 'proof', label: 'Do you have any proof?' }
      ]
    };

    for (const field of fields[value]) {
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(field.id)
            .setLabel(field.label.slice(0, 45))
            .setStyle(field.label.length > 45 ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setRequired(true)
        )
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
        [...fields].map(([key, val]) => ({
          name: key.replace(/_/g, ' ').toUpperCase(),
          value: `\`${val.value}\``
        }))
      )
      .setTimestamp();

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
    await channel.send({
      content: `<@${interaction.user.id}> <@&${PING_ROLE_ID}> opened a ticket.`,
      embeds: [embed],
      components: [closeBtn]
    });

    channel.ticketOwner = interaction.user;
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
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

    const ticketUser = interaction.guild.members.cache.find(m => channel.name.includes(m.user.username));
    const display = ticketUser ? ticketUser.displayName : 'Unknown';
    const username = ticketUser ? ticketUser.user.tag : 'unknown#0000';

    const attachment = new AttachmentBuilder(fileName);
    const logChannel = await client.channels.fetch(TRANSCRIPT_CHANNEL_ID);
    await logChannel.send({
      content: `${display} ( ${username} )'s ${channel.name.split('-')[0]} transcript`,
      files: [attachment]
    });

    fs.unlinkSync(fileName);
    await channel.delete();
  }
});

client.login(TOKEN);

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Quinx Ticket Bot is running!'));
app.listen(port, () => console.log(`🌐 Web server is running on port ${port}`));
