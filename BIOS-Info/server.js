const si = require('systeminformation');

async function getBiosInfo() {
  try {
    const bios = await si.bios();
    console.log('BIOS Information:', bios);
  } catch (error) {
    console.error('Error fetching BIOS info:', error.message);
  }
}

getBiosInfo();
