import fetch from 'node-fetch';

async function test() {
  const formats = ['aac', 'ogg', 'm4a', 'mp3', 'opus'];
  const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
  for (const f of formats) {
    try {
      const initResponse = await fetch(`https://loader.to/ajax/download.php?format=${f}&url=${encodeURIComponent(url)}`);
      const initData = await initResponse.json();
      console.log(`Init ${f}:`, initData.success);
    } catch (e) {
      console.error(e);
    }
  }
}

test();
