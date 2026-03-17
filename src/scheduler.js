import { getRandomGif } from './gifs.js';

const activeSchedules = new Map();

export function startGuildSchedule(client, guildId, channelId, intervalSeconds) {
  stopGuildSchedule(guildId);

  const ms = intervalSeconds * 1000;

  const id = setInterval(async () => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased()) {
        console.error(`[scheduler] Channel ${channelId} in guild ${guildId} is not text-based or missing.`);
        stopGuildSchedule(guildId);
        return;
      }
      await channel.send(getRandomGif());
    } catch (err) {
      console.error(`[scheduler] Failed to post in guild ${guildId}:`, err.message);
      // Auto-stop if channel is gone or bot lost access
      if ([10003, 50001, 50013].includes(err.code)) {
        console.warn(`[scheduler] Stopping schedule for guild ${guildId} due to Discord error ${err.code}.`);
        stopGuildSchedule(guildId);
      }
    }
  }, ms);

  activeSchedules.set(guildId, id);
  console.log(`[scheduler] Started for guild ${guildId} — every ${intervalSeconds}s in channel ${channelId}`);
}

export function stopGuildSchedule(guildId) {
  const id = activeSchedules.get(guildId);
  if (id) {
    clearInterval(id);
    activeSchedules.delete(guildId);
    console.log(`[scheduler] Stopped for guild ${guildId}`);
  }
}

export function restartGuildSchedule(client, guildId, channelId, intervalSeconds) {
  stopGuildSchedule(guildId);
  startGuildSchedule(client, guildId, channelId, intervalSeconds);
}
