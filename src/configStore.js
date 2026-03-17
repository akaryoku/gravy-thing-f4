import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const configPath = path.join(dataDir, 'guilds.json');

export function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '{}', 'utf-8');
  }
}

export function getAllConfigs() {
  ensureDataDir();
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

export function getGuildConfig(guildId) {
  const configs = getAllConfigs();
  return configs[guildId] ?? null;
}

export function saveGuildConfig(guildId, config) {
  const configs = getAllConfigs();
  configs[guildId] = config;
  fs.writeFileSync(configPath, JSON.stringify(configs, null, 2), 'utf-8');
}
