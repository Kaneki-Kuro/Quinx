const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('Send the ticket panel embed.'),

  async execute(interaction) {
    const allowedRoles = [
      '1389484755296452649',
      '1389485202383966228',
      '1389485400334143588',
      '1389485740374622319'
    ];

    // Check if user has one of the allowed roles
    const memberRoles = interaction.member.roles.cache;
    const hasPermission = allowedRoles.some(role => memberRoles.has(role));

    if (!hasPermission) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket Support Panel')
      .setDescription('Click the button below to open a support ticket.\nOur team will assist you shortly.')
      .setColor(0x9146FF) // Purple color

    const channel = interaction.client.channels.cache.get('1389482026528145418');
    if (!channel) {
      return interaction.reply({
        content: '❌ Could not find the ticket channel.',
        ephemeral: true
      });
    }

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: '✅ Ticket panel sent.',
      ephemeral: true
    });
  }
};
