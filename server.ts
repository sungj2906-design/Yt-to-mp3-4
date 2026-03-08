import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.post('/api/convert', async (req, res) => {
    const { url, format, quality, platform } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      if (platform === 'instagram') {
        const apiKey = process.env.INSTAGRAM_API_KEY;
        if (!apiKey || apiKey === 'your_instagram_api_key_here') {
          return res.status(200).json({
            simulated: true,
            title: "Simulated Instagram Download (API Key Required)",
            thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
            downloadUrl: "#",
            format: format === 'mp3' ? 'MP3' : 'MP4',
            message: "Please configure your INSTAGRAM_API_KEY in the environment to enable real Instagram downloads. You can get one from RapidAPI (e.g., 'Instagram Downloader' API)."
          });
        }

        // Using a generic Instagram downloader API from RapidAPI
        // Note: The specific host might need to be adjusted based on the exact API chosen by the user
        const response = await fetch(`https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index?url=${encodeURIComponent(url)}`, {
          headers: {
            'x-rapidapi-host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
            'x-rapidapi-key': apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`Instagram API request failed (Status: ${response.status})`);
        }

        const data = await response.json();

        if (!data || !data.media) {
           throw new Error('Failed to extract media from this Instagram URL. Ensure the post is public.');
        }

        // Extract the best matching media
        let downloadUrl = '';
        let thumbnail = data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80";
        
        if (format === 'mp4') {
           // Try to find a video URL
           downloadUrl = data.media.find((m: any) => m.type === 'video')?.url || data.media[0].url;
        } else {
           // Try to find audio, or fallback to video if the API doesn't separate them
           downloadUrl = data.media.find((m: any) => m.type === 'audio')?.url || data.media[0].url;
        }

        return res.json({
          title: data.title || 'Instagram Media',
          thumbnail: thumbnail,
          downloadUrl: downloadUrl,
          format: format === 'mp3' ? 'MP3' : 'MP4'
        });
      }

      // YouTube Logic
      // Extract video ID from URL
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      // Use loader.to for both MP3 and MP4
      const loaderFormat = format === 'mp3' ? quality : quality; // quality is 'mp3'/'aac' for audio, or '144'/'1080' etc for video
      
      // Start the conversion
      let initResponse;
      try {
        initResponse = await fetch(`https://loader.to/ajax/download.php?format=${loaderFormat}&url=${encodeURIComponent(url)}`);
      } catch (err) {
        throw new Error('Failed to connect to the conversion service. Please try again later.');
      }

      if (!initResponse.ok) {
        throw new Error(`Conversion service is currently unavailable (Status: ${initResponse.status}). Please try again later.`);
      }

      let initData;
      try {
        initData = await initResponse.json();
      } catch (err) {
        throw new Error('Received an invalid response from the conversion service.');
      }
      
      if (!initData || !initData.success) {
        throw new Error(initData?.text || 'Failed to start conversion. The video might be restricted or unavailable.');
      }

      const jobId = initData.id;
      if (!jobId) {
        throw new Error('Failed to retrieve a valid job ID from the conversion service.');
      }

      let downloadUrl = null;
      let attempts = 0;
      const maxAttempts = 45; // 90 seconds max (2s * 45)

      // Poll for completion
      while (!downloadUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const progressResponse = await fetch(`https://p.savenow.to/api/progress?id=${jobId}`);
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.success === 1 && progressData.download_url) {
              downloadUrl = progressData.download_url;
            } else if (progressData.success === 0 && progressData.text === 'Error') {
               throw new Error('Conversion failed on the server. The video might be too long or restricted.');
            }
          }
        } catch (err) {
          console.error('Error polling progress:', err);
          // Continue polling even if one request fails (e.g., temporary network blip)
        }
        attempts++;
      }

      if (!downloadUrl) {
        throw new Error('Conversion timed out. The video might be too large or the server is busy. Please try again later.');
      }

      let displayFormat = '';
      if (format === 'mp3') {
        displayFormat = quality.toUpperCase();
      } else {
        if (quality === '4k') displayFormat = '4K MP4';
        else if (quality === '8k') displayFormat = '8K MP4';
        else displayFormat = `${quality}p MP4`;
      }

      return res.json({
        title: initData.title || 'Media Download',
        thumbnail: initData.info?.image || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        downloadUrl: downloadUrl,
        format: displayFormat
      });

    } catch (error: any) {
      console.error('Conversion error:', error);
      res.status(500).json({ error: error.message || 'Failed to process video' });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
