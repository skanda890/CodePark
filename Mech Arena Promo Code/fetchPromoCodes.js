const axios = require('axios');
const cheerio = require('cheerio');

async function getLatestPromoCodes() {
  try {
    // Example source; update the URL if you want to target other sites
    const { data } = await axios.get('https://www.pcgamesn.com/mech-arena/codes');
    const $ = cheerio.load(data);

    const codes = [];
    // Selector depends on target website structure—adapt as needed!
    $('li strong').each((_, el) => {
      const code = $(el).text().trim();
      if (code && /^[A-Z0-9]+$/.test(code)) { // filter code format
        codes.push(code);
      }
    });

    console.log("Active Mech Arena Promo Codes (live):");
    codes.forEach(code => console.log(`Code: ${code}`));
  } catch (e) {
    console.error('Error fetching promo codes:', e.message);
  }
}

// Run on start
getLatestPromoCodes();
