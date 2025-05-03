#!/usr/bin/env node

const getGitHubProfile = require("./getGitHubProfile");
const getContributionGraph = require("./getContributionGraph");
const chalk = require("chalk");

async function showProfile(username) {
    const profile = await getGitHubProfile(username);
    const graph = await getContributionGraph(username);

    console.log(chalk.blueBright(`GitHub Profile: ${profile.login}`));
    console.log(chalk.green(`Followers: ${profile.followers}`));
    console.log(chalk.yellow(`Profile URL: ${profile.html_url}`));
    console.log(chalk.magenta(`Contribution Graph: ${graph}`));
}

const username = process.argv[2];
if (username) {
    showProfile(username);
} else {
    console.log(chalk.red("Please provide a GitHub username!"));
}