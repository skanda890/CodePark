#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";

// Fetch basic GitHub profile info via API
async function getGitHubProfile(username) {
  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}`);
    return data;
  } catch (error) {
    console.error(chalk.red("Error fetching GitHub profile:"), error.message);
  }
}

// Fetch the README.md from the user's special repo (if available)
async function getReadme(username) {
  const url = `https://raw.githubusercontent.com/${username}/${username}/main/README.md`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    return "No README available.";
  }
}

// Scrape the user profile page for pinned repositories
async function getPinnedRepos(username) {
  try {
    const { data } = await axios.get(`https://github.com/${username}`);
    const dom = new JSDOM(data);
    // GitHub currently renders pinned items with the class "pinned-item-list-item"
    const pinnedElements = dom.window.document.querySelectorAll(".pinned-item-list-item");
    const pinnedRepos = [];
    pinnedElements.forEach((el) => {
      const repoNameElem = el.querySelector("span.repo");
      const repoName = repoNameElem ? repoNameElem.textContent.trim() : "Unknown Repo";
      const descriptionElem = el.querySelector("p.pinned-item-desc");
      const description = descriptionElem ? descriptionElem.textContent.trim() : "";
      pinnedRepos.push({ name: repoName, description });
    });
    return pinnedRepos;
  } catch (error) {
    return [];
  }
}

// Fetch the contribution graph for a given year and return both the text graph and total contributions.
async function getContributionGraph(username, year) {
  // Build URL with year filter via from/to query parameters
  const url = `https://github.com/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`;
  try {
    const { data } = await axios.get(url);
    const dom = new JSDOM(data);
    const squares = dom.window.document.querySelectorAll(".ContributionCalendar-day");
    let totalContributions = 0;
    // Prepare 7 rows—one for each day (Sunday to Saturday)
    let graphRows = Array(7).fill("").map(() => []);
    // Define a mapping from "data-level" to a block style.
    const blocks = [" ", "░", "▒", "▓", "█"];
    squares.forEach((square, index) => {
      const level = parseInt(square.getAttribute("data-level")) || 0;
      const count = parseInt(square.getAttribute("data-count")) || 0;
      totalContributions += count;
      const weekDay = index % 7;
      // Each day rendered as an outlined box. (E.g., [░])
      graphRows[weekDay].push(chalk.green(`[${blocks[level]}]`));
    });
    // Join each row into a string. (Rows correspond to same weekday across weeks.)
    const graph = graphRows.map(row => row.join("")).join("\n");
    return { graph, totalContributions };
  } catch (error) {
    console.error(chalk.red("Error fetching contribution graph:"), error.message);
    return { graph: "", totalContributions: 0 };
  }
}

// (Optional) Extract contribution activity details – here we show a summary.
async function getContributionActivity(username, year, totalContributions) {
  // For simplicity, we use the total contributions value.
  return `Total Contributions in ${year}: ${totalContributions}`;
}

// Assemble and display the profile and related sections in styled boxes.
async function showProfile(username, year) {
  if (!username) {
    console.log(chalk.red("Please provide a GitHub username!"));
    return;
  }

  console.log(chalk.blue(`Fetching data for: ${username} ...`));
  const profile = await getGitHubProfile(username);
  const readme = await getReadme(username);
  const pinnedRepos = await getPinnedRepos(username);
  const { graph, totalContributions } = await getContributionGraph(username, year);
  const activitySummary = await getContributionActivity(username, year, totalContributions);

  // Build the "Profile Overview" box.
  const profileBox = `
┌─────────────────────────────────────────────┐
│ GitHub Profile: ${profile.login.padEnd(33)}│
├─────────────────────────────────────────────┤
│ Followers: ${String(profile.followers).padEnd(4)} | Following: ${String(profile.following).padEnd(4)}        │
│ Location: ${(profile.location || "Not specified").padEnd(31)}│
│ Bio: ${(profile.bio || "No bio available").padEnd(35)}│
│ GitHub URL: ${profile.html_url.padEnd(27)}│
└─────────────────────────────────────────────┘
`;

  // Build the "README.md Summary" box (displaying only the first 5 lines).
  const readmeLines = readme.split("\n").slice(0, 5).join("\n");
  const readmeBox = `
┌─────────────────────────────────────────────┐
│ README.md Summary                           │
├─────────────────────────────────────────────┤
${readmeLines}
└─────────────────────────────────────────────┘
`;

  // Build the "Pinned Repositories" box.
  let pinnedContent =
    pinnedRepos.length > 0
      ? pinnedRepos.map(repo => `• ${repo.name}: ${repo.description}`).join("\n")
      : "No pinned repositories found.";
  const pinnedBox = `
┌─────────────────────────────────────────────┐
│ Pinned Repositories                         │
├─────────────────────────────────────────────┤
${pinnedContent}
└─────────────────────────────────────────────┘
`;

  // Build the "Contribution Activity" box.
  const activityBox = `
┌─────────────────────────────────────────────┐
│ Contribution Activity (${year})             │
├─────────────────────────────────────────────┤
│ ${activitySummary.padEnd(43)}│
└─────────────────────────────────────────────┘
`;

  // Build the "Contribution Graph" box.
  // Wrap the previously generated graph with a border.
  const graphLines = graph.split("\n");
  const graphWidth = graphLines[0].length;
  const borderTop = chalk.blue("┌" + "─".repeat(graphWidth) + "┐");
  const borderBottom = chalk.blue("└" + "─".repeat(graphWidth) + "┘");
  const graphWithBorder = `${borderTop}\n${graphLines.map(line => chalk.blue("│") + line + chalk.blue("│")).join("\n")}\n${borderBottom}`;
  const graphBox = `
┌─────────────────────────────────────────────┐
│ Contribution Graph (${year})                │
├─────────────────────────────────────────────┤
${graphWithBorder}
└─────────────────────────────────────────────┘
`;

  // Print everything out.
  console.log(profileBox);
  console.log(readmeBox);
  console.log(pinnedBox);
  console.log(activityBox);
  console.log(graphBox);
  console.log(chalk.yellow(`Tip: To view contributions for a different year, run: gh-profile <username> <year>`));
}

const username = process.argv[2];
const yearArg = process.argv[3];
const year = yearArg ? yearArg : new Date().getFullYear().toString();
showProfile(username, year);
