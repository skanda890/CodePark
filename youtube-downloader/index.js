const ytdl = require('ytdl-core');
const readlineSync = require('readline-sync');
const fs = require('fs');

const videoUrl = readlineSync.question('Enter the YouTube video URL: ');

if (ytdl.validateURL(videoUrl)) {
  const videoId = ytdl.getURLVideoID(videoUrl);
  const output = `${videoId}.mp4`;

  ytdl(videoUrl, { quality: 'highest' })
    .pipe(fs.createWriteStream(output))
    .on('finish', () => {
      console.log(`Video downloaded successfully as ${output}`);
    })
    .on('error', (err) => {
      console.error('Error downloading video:', err);
    });
} else {
  console.log('Invalid YouTube URL. Please try again.');
}
