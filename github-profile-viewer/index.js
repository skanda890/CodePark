#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";

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
        const { data } = await axios.get(`https://github.com/${username}`);
        const match = data.match(/(https:\/\/.*github\.com\/users\/.*\/contributions.*svg)/);
        return match ? match[0] : "No contribution graph found.";
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

    console.log(chalk.blue(`GitHub Profile: ${profile.login}`));
    console.log(chalk.green(`Followers: ${profile.followers}`));
    console.log(chalk.cyan(`Profile URL: ${profile.html_url}`));
    console.log(chalk.magenta(`Contribution Graph: ${graph}`));
}

const username = process.argv[2];
showProfile(username);
