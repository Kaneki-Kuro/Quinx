const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

    const hasPermission = allowedRoles.some(role =>
      interaction.member.roles.cache.has(role)
    );

    if (!hasPermission) {
      return interaction.reply({
        content: '❌ You don’t have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Ticket Support Panel')
      .setDescription('Click the button below to open a support ticket.\nOur team will assist you shortly.')
      .setColor(0x9146FF);

    const channel = interaction.client.channels.cache.get('1389482026528145418');
    if (!channel) {
      return interaction.reply({
        content: '❌ Target channel not found.',
        ephemeral: true
      });
    }

    await channel.send({ embeds: [embed] });

    return interaction.reply({
      content: '✅ Ticket panel sent!',
      ephemeral: true
    });
  }
};
