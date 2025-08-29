const Place = require('../models/Place');

// GET - show saved places
async function listPlaces(req, res) {
  const places = await Place.find({ userId: req.userId }).sort({
    createdAt: -1,
  });
  res.json(places);
}

// POST - save new place
async function createPlace(req, res) {
  const place = await Place.create({ ...req.body, userId: req.userId });
  res.status(201).json(place);
}

// DELETE - remove a place
async function deletePlace(req, res) {
  const place = await Place.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!place) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}

module.exports = { listPlaces, createPlace, deletePlace };
