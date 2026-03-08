import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('https://www.instagram.com/instagram/');
    const text = await res.text();
    const match = text.match(/"shortcode":"([^"]+)"/);
    if (match) {
      console.log('https://www.instagram.com/p/' + match[1] + '/');
    } else {
      console.log('No match');
    }
  } catch (e) {
    console.error(e);
  }
}

test();
