import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://loader.to/ajax/download.php?format=1080&url=https://www.youtube.com/watch?v=jNQXAC9IVRw');
    const data = await res.json();
    console.log(data);
    
    let done = false;
    while (!done) {
      await new Promise(r => setTimeout(r, 2000));
      const progressRes = await fetch(`https://p.savenow.to/api/progress?id=${data.id}`);
      const progressData = await progressRes.json();
      console.log(progressData);
      if (progressData.success && progressData.download_url) {
        done = true;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

test();
