import path from 'path';
import Trip from '../models/Trip.js';

// GET - show all trips
async function listTrips(req, res) {
  const trips = await Trip.find({ userId: req.userId }).sort({
    date: -1,
    createdAt: -1,
  });
  res.json(trips);
}

// POST - add new trip
async function createTrip(req, res) {
  const isMultipart = req.is('multipart/form-data');
  const body = isMultipart ? JSON.parse(req.body.data || '{}') : req.body;

  const photos = isMultipart
    ? (req.files || []).map((f) => `/uploads/${path.basename(f.path)}`)
    : [];

  const trip = await Trip.create({ ...body, photos, userId: req.userId });
  res.status(201).json(trip);
}

// GET - find singel trip
async function getTrip(req, res) {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
  if (!trip) return res.status(404).json({ message: 'Not found' });
  res.json(trip);
}

// PUT - update trip information
async function updateTrip(req, res) {
  const isMultipart = req.is('multipart/form-data');
  const body = isMultipart ? JSON.parse(req.body.data || '{}') : req.body;

  const newPhotos = isMultipart
    ? (req.files || []).map((f) => `/uploads/${path.basename(f.path)}`)
    : [];

  const update = newPhotos.length ? { ...body, $push: { photos: { $each: newPhotos } } } : body;

  const trip = await Trip.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, update, {
    new: true,
  });
  if (!trip) return res.status(404).json({ message: 'Not found' });
  res.json(trip);
}

// DELETE - delete singel trip
async function deleteTrip(req, res) {
  const trip = await Trip.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!trip) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}

export default { listTrips, createTrip, getTrip, updateTrip, deleteTrip };
