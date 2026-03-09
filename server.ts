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
      // Validate URL based on platform
      let videoId = null;
      if (platform === 'youtube') {
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^&?]{11})/);
        videoId = videoIdMatch ? videoIdMatch[1] : null;
        if (!videoId) {
          return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video or Shorts link.' });
        }
      } else if (platform === 'instagram') {
        const igRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/.+$/;
        if (!igRegex.test(url)) {
          return res.status(400).json({ error: 'Invalid Instagram URL. Please provide a valid Instagram Post, Reel, or TV link.' });
        }
      } else {
        return res.status(400).json({ error: 'Invalid platform selected.' });
      }

      // Map audio bitrates to loader.to formats
      let loaderFormat = quality;
      if (format === 'mp3') {
        if (quality === '120kbps') loaderFormat = 'aac';
        else if (quality === '192kbps') loaderFormat = 'ogg';
        else if (quality === '256kbps') loaderFormat = 'm4a';
        else if (quality === '320kbps') loaderFormat = 'mp3';
        else if (quality === 'opus') loaderFormat = 'opus';
        else loaderFormat = 'mp3';
      }
      
      // Start the conversion
      let initResponse;
      try {
        initResponse = await fetch(`https://loader.to/ajax/download.php?format=${loaderFormat}&url=${encodeURIComponent(url)}`);
      } catch (err) {
        throw new Error('Network error: Failed to connect to the conversion service. Please check your connection and try again.');
      }

      if (!initResponse.ok) {
        throw new Error(`Conversion service is currently unavailable (Status: ${initResponse.status}). Please try again later.`);
      }

      let initData;
      try {
        initData = await initResponse.json();
      } catch (err) {
        throw new Error('Received an invalid response from the conversion service. The service might be undergoing maintenance.');
      }
      
      if (!initData || !initData.success) {
        throw new Error(initData?.message || initData?.text || 'Failed to start conversion. The video might be restricted, private, or unavailable.');
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
        displayFormat = quality === 'opus' ? 'OPUS' : `${quality.toUpperCase()}`;
      } else {
        if (quality === '4k') displayFormat = '4K MP4';
        else if (quality === '8k') displayFormat = '8K MP4';
        else displayFormat = `${quality}p MP4`;
      }

      const defaultThumbnail = platform === 'youtube' && videoId 
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80';

      return res.json({
        title: initData.title || 'Media Download',
        thumbnail: initData.info?.image || defaultThumbnail,
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
