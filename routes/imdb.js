const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/search", async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const response = await axios.get(`https://imdb-com.p.rapidapi.com/search?searchTerm=${encodeURIComponent(title)}`, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "imdb-com.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch IMDb data" });
  }
});

module.exports = router;
