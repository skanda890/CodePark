const axios = require("axios");

async function getGitHubProfile(username) {
    try {
        const { data } = await axios.get(`https://api.github.com/users/${username}`);
        return data;
    } catch (error) {
        console.error("Error fetching GitHub profile:", error.message);
    }
}

module.exports = getGitHubProfile;