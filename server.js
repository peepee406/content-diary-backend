// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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
// Get all watched movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ dateAdded: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movies', error: error.message });
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
    res.status(500).json({ message: 'Error adding movie', error: error.message });
  }
});

// Remove a movie from watched list
app.delete('/api/movies/:id', async (req, res) => {
  try {
    await Movie.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ message: 'Movie removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing movie', error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});