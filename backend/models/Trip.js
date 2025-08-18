import mongoose from "mongoose";
import crypto from "crypto";

const tripSchema = new mongoose.Schema({
  start: String,
  end: String,
  startTime: String,
  endTime: String,
  notes: String,
  startCoords: Object,
  endCoords: Object,
});
