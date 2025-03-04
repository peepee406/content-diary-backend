// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Movie Schema
const movieSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  year: { type: String, required: true },
  type: { type: String, enum: ['movie', 'tv', 'anime'], required: true },
  dateAdded: { type: Date, default: Date.now }
});

const Movie = mongoose.model('Movie', movieSchema);

// Stash Item Schema
const stashSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['link', 'image', 'file'], required: true },
  url: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now }
});

const StashItem = mongoose.model('StashItem', stashSchema);

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Movie Diary API is running' });
});

// Get all watched content (movies, TV shows, anime)
app.get('/api/content', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const content = await Movie.find(query).sort({ dateAdded: -1 });
    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Error fetching content' });
  }
});

// Add content to watchlist
app.post('/api/content', async (req, res) => {
  try {
    const contentExists = await Movie.findOne({ 
      id: req.body.id, 
      type: req.body.type 
    });
    if (contentExists) {
      return res.status(400).json({ message: 'Content already in watchlist' });
    }

    const content = new Movie(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(500).json({ message: 'Error adding content' });
  }
});

// Remove content from watchlist
app.delete('/api/content/:id', async (req, res) => {
  try {
    const result = await Movie.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json({ message: 'Content removed successfully' });
  } catch (error) {
    console.error('Error removing content:', error);
    res.status(500).json({ message: 'Error removing content' });
  }
});

// Stash Routes
// Get all stash items
app.get('/api/stash', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const stashItems = await StashItem.find(query).sort({ dateAdded: -1 });
    res.json(stashItems);
  } catch (error) {
    console.error('Error fetching stash items:', error);
    res.status(500).json({ message: 'Error fetching stash items' });
  }
});

// Add a stash item (link, image, or file)
app.post('/api/stash', upload.single('file'), async (req, res) => {
  try {
    let stashItem;
    
    if (req.file) {
      // File upload
      stashItem = new StashItem({
        title: req.body.title || req.file.originalname,
        description: req.body.description || '',
        type: 'file',
        url: `/uploads/${req.file.filename}`
      });
    } else {
      // Link or external image
      stashItem = new StashItem({
        title: req.body.title,
        description: req.body.description || '',
        type: req.body.type,
        url: req.body.url
      });
    }

    await stashItem.save();
    res.status(201).json(stashItem);
  } catch (error) {
    console.error('Error adding stash item:', error);
    res.status(500).json({ message: 'Error adding stash item' });
  }
});

// Remove a stash item
app.delete('/api/stash/:id', async (req, res) => {
  try {
    const stashItem = await StashItem.findByIdAndDelete(req.params.id);
    
    if (!stashItem) {
      return res.status(404).json({ message: 'Stash item not found' });
    }

    // If it's a file, remove the physical file
    if (stashItem.type === 'file') {
      const filePath = path.join(__dirname, stashItem.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ message: 'Stash item removed successfully' });
  } catch (error) {
    console.error('Error removing stash item:', error);
    res.status(500).json({ message: 'Error removing stash item' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
