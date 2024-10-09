const ytdl = require('ytdl-core');
const readlineSync = require('readline-sync');
const fs = require('fs');

const videoUrl = readlineSync.question('Enter the YouTube video URL: ');

if (ytdl.validateURL(videoUrl)) {
  const videoId = ytdl.getURLVideoID(videoUrl);
  const output = `${videoId}.mp4`;

  console.log(`Starting download for video: ${videoUrl}`);

  const videoStream = ytdl(videoUrl, { quality: 'highest' });

  videoStream.pipe(fs.createWriteStream(output))
    .on('finish', () => {
      console.log(`Video downloaded successfully as ${output}`);
    })
    .on('error', (err) => {
      console.error('Error downloading video:', err);
    });

  videoStream.on('progress', (chunkLength, downloaded, total) => {
    const percent = (downloaded / total * 100).toFixed(2);
    console.log(`Progress: ${percent}%`);
  });

} else {
  console.log('Invalid YouTube URL. Please try again.');
}
