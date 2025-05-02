#!/usr/bin/env node

import puppeteer from "puppeteer";
import { program } from "commander";
import chalk from "chalk";

/**
 * Scrape GitHub contributions from a user's profile
 */
async function scrapeContributions(username) {
  console.log(chalk.blue`\nScraping contributions for ${username}...\n`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://github.com/${username}`);

  try {
    const contributions = await page.evaluate(() => {
      const days = document.querySelectorAll(".ContributionCalendar-day");
      return Array.from(days).map(day => ({
        date: day.getAttribute("data-date"),
        count: day.getAttribute("data-count"),
      })).filter(day => day.date && day.count);
    });

    await browser.close();

    if (contributions.length === 0) {
      console.log(chalk.red("No contributions found."));
      return;
    }

    contributions.forEach((entry, index) => {
      console.log(chalk.green.bold(`${index + 1}. ${entry.date}: ${entry.count} contributions`));
    });

  } catch (err) {
    console.error(chalk.red("Error scraping contributions:"), err.message);
    await browser.close();
  }
}

program
  .version("1.0.0")
  .description("Scrape GitHub profile contributions")
  .option("-u, --user <username>", "GitHub Username")
  .action((options) => {
    if (!options.user) {
      console.error(chalk.red("Please provide a GitHub username using -u <username>"));
      process.exit(1);
    }
    scrapeContributions(options.user);
  });

program.parse(process.argv);
