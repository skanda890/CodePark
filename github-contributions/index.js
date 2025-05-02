#!/usr/bin/env node

import axios from "axios";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = "https://api.github.com/users";

/**
 * Fetch GitHub contributions for a user (with pagination)
 */
async function fetchContributions(username) {
  console.log(chalk.blue`\nFetching contributions for ${username}...\n`);

  try {
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};
    let page = 1;
    let allEvents = [];

    while (true) {
      const response = await axios.get(`${BASE_URL}/${username}/events?per_page=100&page=${page}`, { headers });

      if (response.data.length === 0) break; // Stop when no more events

      allEvents = allEvents.concat(response.data);
      page++; // Move to next page
    }

    const contributions = allEvents.filter(event => event.type === "PushEvent");

    if (contributions.length === 0) {
      console.log(chalk.red("No recent contributions found."));
      return;
    }

    contributions.forEach((event, index) => {
      console.log(chalk.green.bold(`${index + 1}. ${event.repo.name}`));
      console.log(chalk.yellow(`Committed at: ${new Date(event.created_at).toLocaleString()}`));
      console.log("");
    });

  } catch (err) {
    console.error(chalk.red("Error fetching contributions:"), err.message);
  }
}

program
  .version("1.0.0")
  .description("Fetch latest GitHub contributions for a user")
  .option("-u, --user <username>", "GitHub Username")
  .action((options) => {
    if (!options.user) {
      console.error(chalk.red("Please provide a GitHub username using -u <username>"));
      process.exit(1);
    }
    fetchContributions(options.user);
  });

program.parse(process.argv);
