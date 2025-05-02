#!/usr/bin/env node

import Parser from "rss-parser";
import { program } from "commander";
import chalk from "chalk";

const parser = new Parser();
const FEED_URL = "https://blogs.windows.com/feed/"; // Windows Insider Blog Feed

async function fetchBlogs({ canary }) {
  console.log(chalk.blue`\nFetching Windows Insider blog posts...${canary ? " (Filtered for Canary Channel)" : ""}\n`);

  try {
    const feed = await parser.parseURL(FEED_URL);

    // If the -c flag is passed, filter posts mentioning "Canary Channel"
    let posts = feed.items;
    if (canary) {
      posts = posts.filter(post =>
        post.title?.toLowerCase().includes("canary channel") ||
        post.contentSnippet?.toLowerCase().includes("canary channel") ||
        post.categories?.some(category => category.toLowerCase().includes("canary channel")) ||
        post.content?.toLowerCase().includes("canary channel") ||
        post.description?.toLowerCase().includes("canary channel")
      );

      if (posts.length === 0) {
        console.log(chalk.red("No recent Canary Channel posts found."));
        return;
      }
    }

    posts.forEach((post, index) => {
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
  .description("View recent Windows Insider blog posts")
  .option("-c, --canary", "Filter posts for Canary Channel")
  .action((options) => fetchBlogs(options));

program.parse(process.argv);
