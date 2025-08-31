import mongoose from 'mongoose';

const TripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    boatId: { type: mongoose.Types.ObjectId, ref: 'Boat' },
    title: { type: String, required: true, minlength: 2, maxlength: 60 },
    date: { type: Date, required: true },
    durationMinutes: Number,
    crew: [{ type: String }],
    notes: { type: String, maxlength: 2000 },
    start: { lat: Number, lng: Number, name: String },
    end: { lat: Number, lng: Number, name: String },
    route: [{ lat: Number, lng: Number, t: String }],
    wind: { dir: String, speedMs: Number },
    weather: String,
    distanceNm: Number,
    photos: [{ type: String }],
  },
  { timestamps: true }
);
export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
