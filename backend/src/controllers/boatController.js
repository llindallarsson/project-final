import path from 'path';
import Boat from '../models/Boat.js';

// GET - show users boats
async function listBoats(req, res) {
  const boats = await Boat.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(boats);
}

async function getBoat(req, res) {
  try {
    console.log('getBoat called');
    console.log('req.params.id:', req.params.id);
    console.log('req.userId:', req.userId);

    // Kontrollera om ID är giltigt MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid boat ID format' });
    }

    const boat = await Boat.findOne({ _id: req.params.id, userId: req.userId });

    if (!boat) {
      return res.status(404).json({
        message: 'Not found',
        debug: { boatId: req.params.id, userId: req.userId },
      });
    }

    res.json(boat);
  } catch (error) {
    console.error('Error in getBoat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// POST - add new boat
async function createBoat(req, res) {
  try {
    console.log('createBoat called');
    console.log('Content-Type:', req.get('content-type'));
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    let boatData;

    if (req.is('multipart/form-data')) {
      console.log('Processing multipart data');
      const body = JSON.parse(req.body.data || '{}');
      console.log('Parsed body:', body);

      const file = (req.file && `/uploads/${path.basename(req.file.path)}`) || undefined;
      boatData = {
        ...body,
        photoUrl: file,
        userId: req.userId,
      };
    } else {
      boatData = { ...req.body, userId: req.userId };
    }

    console.log('Final boatData:', boatData);

    // Validera att name finns
    if (!boatData.name || boatData.name.trim() === '') {
      return res.status(400).json({
        message: 'Boat name is required',
        received: boatData,
      });
    }

    const boat = await Boat.create(boatData);
    return res.status(201).json(boat);
  } catch (error) {
    console.error('Error creating boat:', error);
    return res.status(400).json({
      message: 'Error creating boat',
      error: error.message,
    });
  }
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
export default { listBoats, getBoat, createBoat, updateBoat, deleteBoat };
