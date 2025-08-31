import path from 'path';
import Boat from '../models/Boat.js';

// GET - show users boats
async function listBoats(req, res) {
  const boats = await Boat.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(boats);
}

// GET - find singel boat
// async function getBoat(req, res) {
//   const boat = await Boat.findOne({ _id: req.params.id, userId: req.userId });
//   if (!boat)
//     return res.status(404).json({
//       message: 'Not found',
//     });
//   res.json(trip);
// }

// POST - add new boat
async function createBoat(req, res) {
  if (req.is('multipart/form-data')) {
    const body = JSON.parse(req.body.data || '{}');
    const file = (req.file && `/uploads/${path.basename(req.file.path)}`) || undefined;
    const boat = await Boat.create({
      ...body,
      photoUrl: file,
      userId: req.userId,
    });
    return res.status(201).json(boat);
  }
  const boat = await Boat.create({ ...req.body, userId: req.userId });
  res.status(201).json(boat);
}

// PUT - update boat information
async function updateBoat(req, res) {
  let update = req.body;
  if (req.is('multipart/form-data')) {
    const body = JSON.parse(req.body.data || '{}');
    const file = (req.file && `/uploads/${path.basename(req.file.path)}`) || undefined;
    update = file ? { ...body, photoUrl: file } : body;
  }
  const boat = await Boat.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, update, {
    new: true,
  });
  if (!boat) return res.status(404).json({ message: 'Not found' });
  res.json(boat);
}

// DELETE - remove boat
async function deleteBoat(req, res) {
  const boat = await Boat.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!boat) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
}
export default { listBoats, createBoat, updateBoat, deleteBoat };
