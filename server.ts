import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post('/api/convert', async (req, res) => {
    const { url, format } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Extract video ID from URL
      const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (!videoId) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
      }

      // MP3 Logic using RapidAPI
      if (format === 'mp3') {
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey || apiKey === 'your_rapidapi_key_here') {
          return res.status(200).json({
            simulated: true,
            title: "Simulated Download (API Key Required)",
            thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
            downloadUrl: "#",
            format: format,
            message: "Please configure your RAPIDAPI_KEY in the environment to enable real MP3 downloads."
          });
        }

        const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
          headers: {
            'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com',
            'x-rapidapi-key': apiKey
          }
        });
        
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if (data.status === 'ok' || data.link) {
          return res.json({
            title: data.title || 'Audio Download',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            downloadUrl: data.link,
            format: 'mp3'
          });
        } else {
          throw new Error(data.msg || 'Failed to get download link');
        }
      } 
      // MP4 Logic using loader.to API
      else if (format === 'mp4') {
        // Start the conversion
        const initResponse = await fetch(`https://loader.to/ajax/download.php?format=1080&url=${encodeURIComponent(url)}`);
        if (!initResponse.ok) throw new Error('Failed to initialize MP4 conversion');
        const initData = await initResponse.json();
        
        if (!initData.success) {
          throw new Error('Failed to start MP4 conversion');
        }

        const jobId = initData.id;
        let downloadUrl = null;
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds max (2s * 30)

        // Poll for completion
        while (!downloadUrl && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const progressResponse = await fetch(`https://p.savenow.to/api/progress?id=${jobId}`);
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.success === 1 && progressData.download_url) {
              downloadUrl = progressData.download_url;
            } else if (progressData.success === 0 && progressData.text === 'Error') {
               throw new Error('Conversion failed on the server');
            }
          }
          attempts++;
        }

        if (!downloadUrl) {
          throw new Error('Conversion timed out. Please try again later.');
        }

        return res.json({
          title: initData.title || 'Video Download',
          thumbnail: initData.info?.image || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          downloadUrl: downloadUrl,
          format: 'mp4'
        });
      } else {
        return res.status(400).json({ error: 'Unsupported format' });
      }

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
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
