require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI);

// Define Schema & Model
const movieSchema = new mongoose.Schema({
  id: String,
  title: String,
  image: String,
  year: String,
  dateAdded: { type: Date, default: Date.now },
});

const Movie = mongoose.model("Movie", movieSchema);

// Get all watched movies
app.get("/watched-movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a movie to watched list
app.post("/watched-movies", async (req, res) => {
  try {
    const movie = new Movie(req.body);
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a movie from watched list
app.delete("/watched-movies/:id", async (req, res) => {
  try {
    await Movie.findOneAndDelete({ id: req.params.id });
    res.json({ message: "Movie removed from watchlist." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});