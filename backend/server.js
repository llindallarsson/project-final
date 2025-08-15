const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path"); // <-- behåll bara DENNA
const fs = require("fs");

// Ladda .env uttryckligen från backend/.env
const envPath = path.join(__dirname, ".env");
console.log("Loading .env from:", envPath);
require("dotenv").config({ path: envPath });

console.log("Loaded MONGO_URL:", process.env.MONGO_URL);

const app = express();
const PORT = process.env.PORT || 8080;

/* ------------------------- Bas-middleware ------------------------- */
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
app.use(express.json({ limit: "2mb" }));

/* -------------------------- DB-anslutning ------------------------- */
console.log(
  "Using MONGO_URL prefix:",
  (process.env.MONGO_URL || "").slice(0, 25) + "..."
);
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("Mongo error", err);
    process.exit(1);
  });

/* ------------------------------ Schemas --------------------------- */
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    boatId: { type: mongoose.Types.ObjectId, ref: "Boat" },
    title: { type: String, required: true, minlength: 2, maxlength: 60 },
    date: { type: Date, required: true },
    durationMinutes: { type: Number },
    crew: [{ type: String }],
    notes: { type: String, maxlength: 2000 },
    start: { lat: Number, lng: Number, name: String },
    end: { lat: Number, lng: Number, name: String },
    route: [{ lat: Number, lng: Number, t: String }],
    wind: { dir: String, speedKn: Number },
    weather: String,
    photos: [{ type: String }],
  },
  { timestamps: true }
);

const boatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    model: String,
    lengthM: Number,
    notes: String,
  },
  { timestamps: true }
);

const placeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    location: { lat: Number, lng: Number },
    notes: String,
  },
  { timestamps: true }
);

const trackingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    tripId: { type: mongoose.Types.ObjectId, ref: "Trip" },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    points: [{ lat: Number, lng: Number, t: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Trip = mongoose.model("Trip", tripSchema);
const Boat = mongoose.model("Boat", boatSchema);
const Place = mongoose.model("Place", placeSchema);
const TrackingSession = mongoose.model("TrackingSession", trackingSchema);

/* ------------------------------- Utils ---------------------------- */
const signToken = (user) =>
  jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* --------------------------- Uploads/Multer ----------------------- */
const ensureDir = (dir) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e.code !== "EEXIST") throw e; // ignorera om den redan finns
  }
};
const uploadsDir = path.join(__dirname, "uploads");
ensureDir(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB/bild
});

// servera bilder statiskt
app.use("/uploads", express.static(uploadsDir));

/* ----------------------------- Health ---------------------------- */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/* ------------------------------ Auth ----------------------------- */
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ message: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  return res.status(201).json({ token: signToken(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({ token: signToken(user) });
});

/* ------------------------------ Trips ---------------------------- */
// GET alla trips (din användare)
app.get("/api/trips", auth, async (req, res) => {
  const trips = await Trip.find({ userId: req.userId }).sort({
    date: -1,
    createdAt: -1,
  });
  res.json(trips);
});

// POST ny trip — funkar med JSON **och** multipart (photos + data)
app.post("/api/trips", auth, upload.array("photos", 10), async (req, res) => {
  const isMultipart = req.is("multipart/form-data");
  const body = isMultipart ? JSON.parse(req.body.data || "{}") : req.body;
  const photos = isMultipart
    ? (req.files || []).map((f) => `/uploads/${path.basename(f.path)}`)
    : [];
  const trip = await Trip.create({ ...body, photos, userId: req.userId });
  res.status(201).json(trip);
});

// GET en trip
app.get("/api/trips/:id", auth, async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
  if (!trip) return res.status(404).json({ message: "Not found" });
  res.json(trip);
});

// PUT uppdatera trip — stöd för att lägga till nya foton via multipart
app.put(
  "/api/trips/:id",
  auth,
  upload.array("photos", 10),
  async (req, res) => {
    const isMultipart = req.is("multipart/form-data");
    const body = isMultipart ? JSON.parse(req.body.data || "{}") : req.body;
    const newPhotos = isMultipart
      ? (req.files || []).map((f) => `/uploads/${path.basename(f.path)}`)
      : [];

    const update = newPhotos.length
      ? { ...body, $push: { photos: { $each: newPhotos } } }
      : body;

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!trip) return res.status(404).json({ message: "Not found" });
    res.json(trip);
  }
);

// DELETE trip
app.delete("/api/trips/:id", auth, async (req, res) => {
  const trip = await Trip.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!trip) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

/* ------------------------------ Boats ---------------------------- */
app.get("/api/boats", auth, async (req, res) => {
  const boats = await Boat.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(boats);
});
app.post("/api/boats", auth, async (req, res) => {
  const boat = await Boat.create({ ...req.body, userId: req.userId });
  res.status(201).json(boat);
});
app.put("/api/boats/:id", auth, async (req, res) => {
  const boat = await Boat.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  if (!boat) return res.status(404).json({ message: "Not found" });
  res.json(boat);
});
app.delete("/api/boats/:id", auth, async (req, res) => {
  const boat = await Boat.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!boat) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

/* ------------------------------ Places --------------------------- */
app.get("/api/places", auth, async (req, res) => {
  const places = await Place.find({ userId: req.userId }).sort({
    createdAt: -1,
  });
  res.json(places);
});
app.post("/api/places", auth, async (req, res) => {
  const place = await Place.create({ ...req.body, userId: req.userId });
  res.status(201).json(place);
});
app.delete("/api/places/:id", auth, async (req, res) => {
  const place = await Place.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!place) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

/* --------------------------- Tracking (bas) ---------------------- */
app.post("/api/tracking/start", auth, async (req, res) => {
  const session = await TrackingSession.create({
    userId: req.userId,
    points: [],
  });
  res.status(201).json({ sessionId: session._id });
});
app.post("/api/tracking/:id/point", auth, async (req, res) => {
  const { lat, lng, t } = req.body;
  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, isActive: true },
    { $push: { points: { lat, lng, t } } },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ ok: true });
});
app.post("/api/tracking/:id/stop", auth, async (req, res) => {
  const session = await TrackingSession.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId, isActive: true },
    { isActive: false, endedAt: new Date() },
    { new: true }
  );
  if (!session) return res.status(404).json({ message: "Session not found" });
  res.json({ ok: true, session });
});

/* ------------------------------ Start ---------------------------- */
app.listen(PORT, () =>
  console.log(`API listening on http://localhost:${PORT}`)
);
