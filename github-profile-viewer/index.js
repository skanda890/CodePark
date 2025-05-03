#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";

async function getContributionGraph(username) {
    try {
        const { data } = await axios.get(`https://github.com/users/${username}/contributions`);
        const dom = new JSDOM(data);
        const squares = dom.window.document.querySelectorAll(".ContributionCalendar-day");

        let graphRows = Array(7).fill("").map(() => []); // 7 rows for each day of the week

        squares.forEach((square, index) => {
            const level = square.getAttribute("data-level") || 0;
            const colors = [" ", "░", "▒", "▓", "█"]; // Light to dark blocks
            const weekDay = index % 7;
            graphRows[weekDay].push(chalk.green(colors[level]));
        });

        // Render each row
        return graphRows.map(row => row.join("")).join("\n");
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

    const graph = await getContributionGraph(username);
    console.log(chalk.magenta("Contribution Graph:\n"));
    console.log(graph);
}

const username = process.argv[2];
showProfile(username);
