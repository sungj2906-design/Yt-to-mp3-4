import fetch from 'node-fetch';

async function test() {
  try {
    const url = 'https://www.instagram.com/p/C-V-1234567/';
    const initResponse = await fetch(`https://loader.to/ajax/download.php?format=1080&url=${encodeURIComponent(url)}`);
    const initData = await initResponse.json();
    console.log('Init:', initData);
    
    if (initData.success) {
      const jobId = initData.id;
      let downloadUrl = null;
      let attempts = 0;
      while (!downloadUrl && attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const progressResponse = await fetch(`https://p.savenow.to/api/progress?id=${jobId}`);
        const progressData = await progressResponse.json();
        console.log('Progress:', progressData);
        if (progressData.success === 1 && progressData.download_url) {
          downloadUrl = progressData.download_url;
        }
        attempts++;
      }
      console.log('Download URL:', downloadUrl);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
