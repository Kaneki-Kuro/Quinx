const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

// 👇 Load all commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('TOKEN start:', process.env.TOKEN.slice(0, 10));
console.log('Commands found:', commands.map(c => c.name)); // 👈 Confirm it sees /tickets

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Deploying commands...');

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Successfully deployed commands:', data.map(cmd => cmd.name));
  } catch (error) {
    console.error('❌ DEPLOY ERROR:', error);
  }
})();
