#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";

async function getGitHubProfile(username) {
    try {
        const { data } = await axios.get(`https://api.github.com/users/${username}`);
        return data;
    } catch (error) {
        console.error(chalk.red("Error fetching GitHub profile:", error.message));
    }
}

async function getContributionGraph(username) {
    try {
        const { data } = await axios.get(`https://github.com/users/${username}/contributions`);
        const dom = new JSDOM(data);
        const squares = dom.window.document.querySelectorAll(".ContributionCalendar-day");

        let graphRows = Array(7).fill("").map(() => []); // Create 7 rows for days of the week

        squares.forEach((square, index) => {
            const level = square.getAttribute("data-level") || 0;
            const colors = [" ", "░", "▒", "▓", "█"]; // Contribution density blocks
            const weekDay = index % 7;
            graphRows[weekDay].push(chalk.green(colors[level]));
        });

        // Create top and bottom borders
        const width = graphRows[0].length;
        const borderTop = chalk.blue("┌" + "─".repeat(width) + "┐");
        const borderBottom = chalk.blue("└" + "─".repeat(width) + "┘");

        // Render each row with side borders
        const graph = graphRows.map(row => chalk.blue("│") + row.join("") + chalk.blue("│")).join("\n");

        return `${borderTop}\n${graph}\n${borderBottom}`;
    } catch (error) {
        console.error(chalk.red("Error fetching contribution graph:", error.message));
    }
}

async function showProfile(username) {
    if (!username) {
        console.log(chalk.red("Please provide a GitHub username!"));
        return;
    }

    console.log(chalk.blue(`Fetching data for: ${username}...`));

    const profile = await getGitHubProfile(username);
    if (!profile) return;

    const graph = await getContributionGraph(username);

    console.log(`
┌──────────────────────────────────────────┐
│  GitHub Profile: ${profile.login}        │
├──────────────────────────────────────────┤
│  Followers: ${profile.followers}   |  Following: ${profile.following}  │
│  Location: ${profile.location || "Not specified"}                      │
│  Bio: ${profile.bio || "No bio available"}                            │
│  GitHub URL: ${profile.html_url}                                      │
└──────────────────────────────────────────┘
`);

    console.log(chalk.magenta("Contribution Graph:\n"));
    console.log(graph);
}

const username = process.argv[2];
showProfile(username);
