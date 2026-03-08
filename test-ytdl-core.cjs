const ytdl = require('@distube/ytdl-core');

async function test() {
  try {
    const info = await ytdl.getInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw');
    console.log('Title:', info.videoDetails.title);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    console.log('Audio formats:', audioFormats.length);
  } catch (e) {
    console.error(e);
  }
}

test();
