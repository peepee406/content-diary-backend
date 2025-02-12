require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => res.send("API is running"));

app.listen(5000, () => console.log("Server running on port 5000"));
const imdbRoutes = require("./routes/imdb");
app.use("/api/imdb", imdbRoutes);
