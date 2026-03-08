import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://loader.to/ajax/download.php?format=m4a&url=https://www.youtube.com/watch?v=jNQXAC9IVRw');
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

test();
