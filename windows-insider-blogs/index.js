#!/usr/bin/env node

import Parser from "rss-parser";
import { program } from "commander";
import chalk from "chalk";

const parser = new Parser();
const FEED_URL = "https://blogs.windows.com/feed/"; // Windows Insider Blog Feed

async function fetchBlogs(limit = 5) {
  console.log(chalk.blue`\nFetching Canary Channel blog posts from the last 2 days...\n`);

  try {
    const feed = await parser.parseURL(FEED_URL);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Filter posts mentioning "Canary Channel" AND published within the last 2 days
    const canaryPosts = feed.items.filter(post =>
      (post.title?.toLowerCase().includes("canary channel") ||
      post.contentSnippet?.toLowerCase().includes("canary channel") ||
      post.categories?.some(category => category.toLowerCase().includes("canary channel")) ||
      post.content?.toLowerCase().includes("canary channel") ||
      post.description?.toLowerCase().includes("canary channel")) &&
      new Date(post.pubDate) >= twoDaysAgo // Check if post is within last 2 days
    );

    if (canaryPosts.length === 0) {
      console.log(chalk.red("No recent Canary Channel posts found in the last 2 days."));
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
  .description("View recent Windows Insider blog posts (filtered for Canary Channel & last 2 days)")
  .option("-l, --limit <number>", "Number of posts to fetch", "5")
  .action((options) => fetchBlogs(parseInt(options.limit)));

program.parse(process.argv);
