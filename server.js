require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get all watched movies
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ dateAdded: -1 });
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
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
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Error adding movie', error: error.message });
  }
});

// Remove a movie from watched list
app.delete('/api/movies/:id', async (req, res) => {
  try {
    await Movie.findOneAndDelete({ id: req.params.id });
    res.status(200).json({ message: 'Movie removed successfully' });
  } catch (error) {
    console.error('Error removing movie:', error);
    res.status(500).json({ message: 'Error removing movie', error: error.message });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});