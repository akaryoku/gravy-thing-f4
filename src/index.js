import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { getAllConfigs, ensureDataDir } from './configStore.js';
import { startGuildSchedule } from './scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Dynamically load all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Bot ready — re-hydrate saved guild schedules
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  ensureDataDir();
  const configs = getAllConfigs();

  for (const [guildId, config] of Object.entries(configs)) {
    if (config.enabled) {
      startGuildSchedule(client, guildId, config.channelId, config.intervalSeconds);
    }
  }

  console.log(`Re-hydrated ${Object.keys(configs).length} guild schedule(s).`);
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[command] Error executing /${interaction.commandName}:`, err);
    const reply = { content: 'Something went wrong running that command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
