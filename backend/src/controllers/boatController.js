const path = require("path");
const Boat = require("../models/Boat");

// GET /api/boats
async function listBoats(req, res) {
  const boats = await Boat.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(boats);
}

// POST /api/boats (JSON or multipart with `photo`)
async function createBoat(req, res) {
  if (req.is("multipart/form-data")) {
    const body = JSON.parse(req.body.data || "{}");
    const file =
      (req.file && `/uploads/${path.basename(req.file.path)}`) || undefined;
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

// PUT /api/boats/:id (JSON or multipart to replace `photoUrl`)
async function updateBoat(req, res) {
  let update = req.body;
  if (req.is("multipart/form-data")) {
    const body = JSON.parse(req.body.data || "{}");
    const file =
      (req.file && `/uploads/${path.basename(req.file.path)}`) || undefined;
    update = file ? { ...body, photoUrl: file } : body;
  }
  const boat = await Boat.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    update,
    { new: true }
  );
  if (!boat) return res.status(404).json({ message: "Not found" });
  res.json(boat);
}

// DELETE /api/boats/:id
async function deleteBoat(req, res) {
  const boat = await Boat.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!boat) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
}

module.exports = { listBoats, createBoat, updateBoat, deleteBoat };
