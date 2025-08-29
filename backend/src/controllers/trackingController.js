const TrackingSession = require("../models/TrackingSession");

// POST /api/tracking/start
async function startSession(req, res) {
  const session = await TrackingSession.create({
    userId: req.userId,
    points: [],
  });
  res.status(201).json({ sessionId: session._id });
}

// POST /api/tracking/:id/point
async function addPoint(req, res) {
  const { lat, lng, t } = req.body || {};
  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, isActive: true },
    { $push: { points: { lat, lng, t } } },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ ok: true });
}

// POST /api/tracking/:id/stop
async function stopSession(req, res) {
  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, isActive: true },
    { isActive: false, endedAt: new Date() },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ ok: true, session });
}

module.exports = { startSession, addPoint, stopSession };
