const axios = require('axios');
const cheerio = require('cheerio');
const readlineSync = require('readline-sync');

const zee5Url = 'https://www.zee5.com';

async function fetchProgramEpisodes(programName) {
  try {
    const response = await axios.get(zee5Url);
    const html = response.data;
    const $ = cheerio.load(html);

    const episodes = [];
    $('.program-card').each((index, element) => {
      const title = $(element).find('.program-title').text();
      if (title.toLowerCase().includes(programName.toLowerCase())) {
        const link = $(element).find('a').attr('href');
        episodes.push({ title, link });
      }
    });

    if (episodes.length > 0) {
      console.log(`Episodes for "${programName}":`);
      episodes.forEach(episode => {
        console.log(`Title: ${episode.title}, Link: ${episode.link}`);
      });
    } else {
      console.log(`No episodes found for "${programName}".`);
    }
  } catch (error) {
    console.error('Error fetching episodes:', error);
  }
}

const programName = readlineSync.question('Enter the name of the program: ');
fetchProgramEpisodes(programName);
