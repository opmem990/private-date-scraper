import express from 'express';
import cors from 'cors';
import { MOVIES } from '@consumet/extensions';

const app = express();
app.use(cors());

const flixhq = new MOVIES.FlixHQ();

app.get('/scrape', async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  try {
    const searchResults = await flixhq.search(title);
    if (!searchResults.results || searchResults.results.length === 0) {
      return res.status(404).json({ error: 'No movies found' });
    }
    
    const mediaId = searchResults.results[0].id;
    const mediaInfo = await flixhq.fetchMediaInfo(mediaId);
    
    if (!mediaInfo.episodes || mediaInfo.episodes.length === 0) {
      return res.status(404).json({ error: 'No links found' });
    }
    
    const episodeId = mediaInfo.episodes[0].id;
    const streamSources = await flixhq.fetchEpisodeSources(episodeId, mediaId);
    
    const highQualityStream = streamSources.sources.find(s => s.quality === 'auto' || s.quality === '1080p') || streamSources.sources[0];
    
    res.json({ url: highQualityStream.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Private movie engine alive on port ${PORT}`));
