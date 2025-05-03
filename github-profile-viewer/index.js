#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import { JSDOM } from "jsdom";

async function getContributionGraph(username) {
    try {
        const { data } = await axios.get(`https://github.com/users/${username}/contributions`);
        const dom = new JSDOM(data);
        const squares = dom.window.document.querySelectorAll(".ContributionCalendar-day");

        let graph = "";
        squares.forEach((square, index) => {
            const level = square.getAttribute("data-level") || 0;
            const colors = [" ", "░", "▒", "▓", "█"]; // Light to dark blocks
            graph += chalk.green(colors[level]);

            if ((index + 1) % 7 === 0) graph += "\n"; // New row every 7 days
        });

        return graph;
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
