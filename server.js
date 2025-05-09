const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Route untuk mendapatkan info video
app.get('/info', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const info = await ytdl.getInfo(url);
    
    const formats = {
      video: info.formats
        .filter(f => f.hasVideo && f.hasAudio)
        .map(f => ({ 
          quality: f.qualityLabel, 
          itag: f.itag,
          type: 'video'
        })),
      audio: info.formats
        .filter(f => f.hasAudio && !f.hasVideo)
        .map(f => ({ 
          quality: `${f.audioBitrate || 'unknown'}kbps`, 
          itag: f.itag,
          type: 'audio'
        }))
    };

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      formats: [...formats.video, ...formats.audio]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route untuk download
app.get('/download', async (req, res) => {
  try {
    const { url, itag, type } = req.query;
    if (!url || !itag) return res.status(400).json({ error: 'Missing parameters' });

    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, { quality: itag });
    
    let filename = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    let extension = type === 'audio' ? 'mp3' : 'mp4';
    
    res.header('Content-Disposition', `attachment; filename="${filename}.${extension}"`);
    
    ytdl(url, { format: format }).pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route utama
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Hosting file statis
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});