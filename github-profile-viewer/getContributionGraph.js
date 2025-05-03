const axios = require("axios");

async function getContributionGraph(username) {
    try {
        const { data } = await axios.get(`https://github.com/${username}`);
        const match = data.match(/(https:\/\/.*github\.com\/users\/.*\/contributions.*svg)/);
        return match ? match[0] : "No contribution graph found.";
    } catch (error) {
        console.error("Error fetching contribution graph:", error.message);
    }
}

module.exports = getContributionGraph;