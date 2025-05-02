#!/usr/bin/env node

const Parser = require("rss-parser");
const { program } = require("commander");
import chalk from "chalk";

const parser = new Parser();
const FEED_URL = "https://blogs.windows.com/feed/"; // Windows Insider Blog Feed

async function fetchBlogs(limit = 5) {
  console.log(`\n${chalk.blue("Fetching Windows Insider blog posts...")}\n`);

  try {
    const feed = await parser.parseURL(FEED_URL);
    feed.items.slice(0, limit).forEach((post, index) => {
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
  .option("-l, --limit <number>", "Number of posts to fetch", "5")
  .action((options) => fetchBlogs(parseInt(options.limit)));

program.parse(process.argv);
