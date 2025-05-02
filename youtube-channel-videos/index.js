#!/usr/bin/env node

import { google } from "googleapis";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.YOUTUBE_API_KEY;
const youtube = google.youtube("v3");

async function fetchVideos(channelId) {
  console.log(chalk.blue`\nFetching latest videos and shorts...\n`);

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
  .option("-c, --channel <channelId>", "YouTube Channel ID")
  .action((options) => {
    if (!options.channel) {
      console.error(chalk.red("Please provide a YouTube Channel ID using -c <channelId>"));
      process.exit(1);
    }
    fetchVideos(options.channel);
  });

program.parse(process.argv);