#!/usr/bin/env node

import { google } from "googleapis";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube("v3");

/**
 * Convert YouTube channel name to channel ID
 */
async function getChannelId(channelName) {
  try {
    const response = await youtube.search.list({
      key: API_KEY,
      q: channelName,
      part: "snippet",
      type: "channel",
      maxResults: 1,
    });

    const channel = response.data.items[0];
    return channel?.id?.channelId || null;
  } catch (err) {
    console.error(chalk.red("Error fetching channel ID:"), err.message);
    return null;
  }
}

/**
 * Fetch latest videos and shorts from the channel
 */
async function fetchVideos(channelName) {
  console.log(chalk.blue`\nFetching latest videos for ${channelName}...\n`);

  const channelId = await getChannelId(channelName);
  if (!channelId) {
    console.log(chalk.red("Could not find the channel."));
    return;
  }

  try {
    const response = await youtube.search.list({
      key: API_KEY,
      channelId,
      part: "snippet",
      order: "date",
      maxResults: 10,
    });

    const videos = response.data.items.filter(item => item.id.videoId);

    if (videos.length === 0) {
      console.log(chalk.red("No recent videos found."));
      return;
    }

    videos.forEach((video, index) => {
      console.log(chalk.green.bold(`${index + 1}. ${video.snippet.title}`));
      console.log(chalk.yellow(`https://www.youtube.com/watch?v=${video.id.videoId}`));
      console.log(chalk.gray(video.snippet.publishedAt));
      console.log("");
    });

  } catch (err) {
    console.error(chalk.red("Error fetching videos:"), err.message);
  }
}

program
  .version("1.0.0")
  .description("Fetch latest videos and shorts from a YouTube channel")
  .option("-n, --name <channelName>", "YouTube Channel Name")
  .action((options) => {
    if (!options.name) {
      console.error(chalk.red("Please provide a YouTube Channel Name using -n <channelName>"));
      process.exit(1);
    }
    fetchVideos(options.name);
  });

program.parse(process.argv);
