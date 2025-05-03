#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";

// Fetch GitHub profile info via API.
async function getGitHubProfile(username) {
  try {
    const { data } = await axios.get(`https://api.github.com/users/${username}`);
    return data;
  } catch (error) {
    console.error(chalk.red("Error fetching GitHub profile:"), error.message);
  }
}

// Fetch the actual README.md from the repository named after your username.
async function getReadme(username) {
  const url = `https://raw.githubusercontent.com/${username}/${username}/main/README.md`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    return "No README available.";
  }
}

// Scrape the user profile page for pinned repositories.
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

// Fetch the contribution graph for a given year, wrapping each cell in its own outline.
async function getContributionGraph(username, year) {
  // Build URL with year filter via from/to query parameters.
  const url = `https://github.com/users/${username}/contributions?from=${year}-01-01&to=${year}-12-31`;
  try {
    const { data } = await axios.get(url);
    const dom = new JSDOM(data);
    const squares = dom.window.document.querySelectorAll(".ContributionCalendar-day");
    let totalContributions = 0;
    // Initialize an array for 7 rows (one per weekday: Sunday to Saturday).
    let graphRows = Array.from({ length: 7 }, () => []);
    // Map each "data-level" to an appropriate Unicode block.
    const blocks = [" ", "\u2591", "\u2592", "\u2593", "\u2588"];
    
    squares.forEach((square, index) => {
      const level = parseInt(square.getAttribute("data-level")) || 0;
      const count = parseInt(square.getAttribute("data-count")) || 0;
      totalContributions += count;
      const weekDay = index % 7;
      // Create a cell as a small outlined box.
      const cell = [
        chalk.green("┌───┐"),
        chalk.green(`│ ${blocks[level]} │`),
        chalk.green("└───┘")
      ];
      graphRows[weekDay].push(cell);
    });
    
    // Now join each row’s cells horizontally. Each cell has three lines.
    let finalRows = [];
    graphRows.forEach((rowCells) => {
      // For each cell in the row, join the top lines, middle lines, and bottom lines.
      const line1 = rowCells.map(cell => cell[0]).join(" ");
      const line2 = rowCells.map(cell => cell[1]).join(" ");
      const line3 = rowCells.map(cell => cell[2]).join(" ");
      finalRows.push(line1 + "\n" + line2 + "\n" + line3);
    });

    // Join the rows by newlines (the top row corresponds to Sundays, etc.)
    const finalGraph = finalRows.join("\n\n");
    return { graph: finalGraph, totalContributions };
  } catch (error) {
    console.error(chalk.red("Error fetching contribution graph:"), error.message);
    return { graph: "", totalContributions: 0 };
  }
}

// Summarize contribution activity details.
async function getContributionActivity(username, year, totalContributions) {
  return `Total Contributions in ${year}: ${totalContributions}`;
}

// Helper: Create a boxed section with a title and its content.
function createBox(title, content) {
  const lines = content.split("\n");
  let maxWidth = Math.max(title.length, ...lines.map(line => line.length));
  const topBorder = "┌" + "─".repeat(maxWidth + 2) + "┐";
  const titleLine = "│ " + title.padEnd(maxWidth) + " │";
  const separator = "├" + "─".repeat(maxWidth + 2) + "┤";
  const contentLines = lines.map(line => "│ " + line.padEnd(maxWidth) + " │").join("\n");
  const bottomBorder = "└" + "─".repeat(maxWidth + 2) + "┘";
  return `${topBorder}\n${titleLine}\n${separator}\n${contentLines}\n${bottomBorder}`;
}

// Assemble and display all sections.
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

  // Profile Overview Box.
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

  // README.md Box (displaying the actual README.md file content).
  const readmeBox = createBox("README.md", readme);

  // Pinned Repositories Box.
  const pinnedContent = pinnedRepos.length > 0
    ? pinnedRepos.map(repo => `• ${repo.name}: ${repo.description}`).join("\n")
    : "No pinned repositories found.";
  const pinnedBox = createBox("Pinned Repositories", pinnedContent);

  // Contribution Activity Box.
  const activityBox = createBox(`Contribution Activity (${year})`, activitySummary);

  // Contribution Graph Box.
  // Instead of wrapping the entire graph, each cell is already outlined.
  // We still add an overall title box around the graph.
  const graphBox = createBox(`Contribution Graph (${year})`, graph);

  // Print all sections.
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
