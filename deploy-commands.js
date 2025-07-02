console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('GUILD_ID:', process.env.GUILD_ID);
console.log('TOKEN start:', process.env.TOKEN.slice(0, 10));

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Deploying commands...');

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('Success:', data);
  } catch (error) {
    console.error('DEPLOY ERROR:', error);
  }
})();
