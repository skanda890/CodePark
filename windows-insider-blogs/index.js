#!/usr/bin/env node

import Parser from "rss-parser";
import { program } from "commander";
import chalk from "chalk";

const parser = new Parser();
const FEED_URL = "https://blogs.windows.com/feed/"; // Windows Insider Blog Feed

async function fetchBlogs(limit = 5) {
  console.log(chalk.blue`\nFetching Canary Channel blog posts...\n`);

  try {
    const feed = await parser.parseURL(FEED_URL);

    // Filter posts mentioning "Canary Channel"
    const canaryPosts = feed.items.filter(post =>
      post.title.includes("Canary Channel") || 
      (post.contentSnippet && post.contentSnippet.includes("Canary Channel"))
    );

    if (canaryPosts.length === 0) {
      console.log(chalk.red("No recent posts found for Canary Channel."));
      return;
    }

    canaryPosts.slice(0, limit).forEach((post, index) => {
      console.log(chalk.green.bold(`${index + 1}. ${post.title}`));
      console.log(chalk.yellow(post.link));
      console.log(chalk.gray(post.pubDate));
      console.log("");
    });

  } catch (err) {
    console.error(chalk.red("Error fetching blog posts:"), err.message);
  }
}

program
  .version("1.0.0")
  .description("View recent Windows Insider blog posts (filtered for Canary Channel)")
  .option("-l, --limit <number>", "Number of posts to fetch", "5")
  .action((options) => fetchBlogs(parseInt(options.limit)));

program.parse(process.argv);
