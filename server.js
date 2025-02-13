// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
  dateAdded: { type: Date, default: Date.now }
});

const Movie = mongoose.model('Movie', movieSchema);

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Movie Diary API is running' });
});

// Get all watched movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ dateAdded: -1 });
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Add a movie to watched list
app.post('/api/movies', async (req, res) => {
  try {
    const movieExists = await Movie.findOne({ id: req.body.id });
    if (movieExists) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Error adding movie' });
  }
});

// Remove a movie from watched list
app.delete('/api/movies/:id', async (req, res) => {
  try {
    const result = await Movie.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json({ message: 'Movie removed successfully' });
  } catch (error) {
    console.error('Error removing movie:', error);
    res.status(500).json({ message: 'Error removing movie' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});