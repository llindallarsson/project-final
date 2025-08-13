import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl);
mongoose.Promise = Promise;

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
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
  const { start, end, startTime, endTime, notes } = req.body;

  if (!start || !end || !startTime || !endTime) {
    return res.status(400).json({ error: "Alla fält utom anteckningar krävs" });
  }

  const newTrip = {
    id: Date.now(),
    start,
    end,
    startTime,
    endTime,
    notes: notes || "",
  };

  trips.push(newTrip);
  res.status(201).json(newTrip);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
