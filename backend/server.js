import cors from "cors";
import express from "express";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(
  cors({
    origin: "*", // eller specifikt 'https://din-netlify-url.netlify.app'
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

let trips = [];

app.get("/", (req, res) => {
  res.send("Hello Technigo!");
});

// GET a trip
app.get("/api/trips", (req, res) => {
  res.json(trips);
});

// POST a trip
app.post("/api/trips", (req, res) => {
  const { start, end, startTime, endTime, notes, startCoords, endCoords } =
    req.body;

  const newTrip = {
    id: Date.now(),
    start,
    end,
    startTime,
    endTime,
    notes: notes || "",
    startCoords,
    endCoords,
  };

  trips.push(newTrip);
  res.status(201).json(newTrip);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
