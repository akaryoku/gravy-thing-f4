import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { saveGuildConfig } from '../configStore.js';
import { restartGuildSchedule } from '../scheduler.js';
import { getRandomGif } from '../gifs.js';

export const data = new SlashCommandBuilder()
  .setName('setuptf4')
  .setDescription('Set up The Thing (Fantastic Four) GIF poster for this server')
  .addChannelOption((o) =>
    o
      .setName('channel')
      .setDescription('Text channel to post GIFs in')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true),
  )
  .addIntegerOption((o) =>
    o
      .setName('interval')
      .setDescription('Seconds between posts (120–600)')
      .setMinValue(120)
      .setMaxValue(600)
      .setRequired(true),
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  // Secondary permission check
  if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({
      content: 'You need the **Manage Server** permission to use this command.',
      ephemeral: true,
    });
  }

  const channel = interaction.options.getChannel('channel');
  const interval = interaction.options.getInteger('interval');

  // Check that the bot can send messages in the target channel
  const botPerms = channel.permissionsFor(interaction.guild.members.me);
  if (!botPerms || !botPerms.has(PermissionFlagsBits.SendMessages)) {
    return interaction.reply({
      content: `I don't have permission to send messages in ${channel}. Please update my permissions and try again.`,
      ephemeral: true,
    });
  }

  // Save config and start scheduler
  saveGuildConfig(interaction.guildId, {
    channelId: channel.id,
    intervalSeconds: interval,
    enabled: true,
  });

  restartGuildSchedule(interaction.client, interaction.guildId, channel.id, interval);

  // Post one GIF immediately so the admin can verify
  try {
    await channel.send(getRandomGif());
  } catch (err) {
    console.error(`[setuptf4] Failed to send initial GIF:`, err.message);
  }

  return interaction.reply(
    `It's clobberin' time! The Thing GIFs will be posted in ${channel} every **${interval} seconds**. A preview GIF was just sent!`,
  );
}
