#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import terminalImage from "terminal-image"; // To render the graph in terminal

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

    const graphUrl = await getContributionGraph(username);

    console.log(chalk.blue(`GitHub Profile: ${profile.login}`));
    console.log(chalk.green(`Followers: ${profile.followers}`));
    console.log(chalk.yellow(`Public Repos: ${profile.public_repos}`));
    console.log(chalk.cyan(`Bio: ${profile.bio || "No bio available"}`));
    console.log(chalk.magenta(`Profile URL: ${profile.html_url}`));
    console.log(chalk.magenta(`Contribution Graph: ${graphUrl}`));

    // Optional: Render Graph in Terminal (If Image Rendering Works)
    if (graphUrl.startsWith("https")) {
        const response = await axios.get(graphUrl, { responseType: "arraybuffer" });
        const image = await terminalImage.buffer(Buffer.from(response.data));
        console.log(image);
    }
}

const username = process.argv[2];
showProfile(username);
