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

  let startTime = Date.now();
  videoStream.on('progress', (chunkLength, downloaded, total) => {
    const percent = (downloaded / total * 100).toFixed(2);
    const downloadedMinutes = (Date.now() - startTime) / 1000 / 60;
    const estimatedDownloadTime = (downloadedMinutes / (downloaded / total)).toFixed(2);
    console.log(`Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)}MB of ${(total / 1024 / 1024).toFixed(2)}MB) - Estimated time left: ${estimatedDownloadTime} minutes`);
  });

} else {
  console.log('Invalid YouTube URL. Please try again.');
}
